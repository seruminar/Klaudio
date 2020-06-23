import moment, { Moment } from 'moment';
import React, { Dispatch, FC, SetStateAction, useCallback, useState } from 'react';
import useAsyncEffect from 'use-async-effect';

import MomentUtils from '@date-io/moment';
import {
    Box,
    Button,
    createStyles,
    Dialog,
    Grid,
    makeStyles,
    Slider,
    TextField,
    Typography
} from '@material-ui/core';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';

import { experience } from '../../../../appSettings.json';
import { useDependency } from '../../../../dependencyContainer';
import { ICrmService } from '../../../../services/crmService/CrmService';
import { ICrmServiceCache } from '../../../../services/crmService/CrmServiceCache';
import { ICrmAccountService } from '../../../../services/crmService/models/ICrmAccountService';
import { ICrmTicket } from '../../../../services/crmService/models/ICrmTicket';
import { ProductFamily } from '../../../../services/crmService/models/ProductFamily';
import { ServiceTaskStatus } from '../../../../services/crmService/models/ServiceTaskStatus';
import { account, entityNames } from '../../../../terms.en-us.json';
import { useSubscriptionEffect } from '../../../../utilities/observables';
import { wait } from '../../../../utilities/promises';
import { format } from '../../../../utilities/strings';
import { Loading } from '../../../shared/Loading';
import { TicketsFilterField } from '../TicketsFilterField';

interface ILogCreditsDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  creditsService: ICrmAccountService;
  ticket: ICrmTicket;
  onClose: (event: {}, reason: "backdropClick" | "escapeKeyDown") => void;
}

const useStyles = makeStyles((theme) =>
  createStyles({
    fields: {
      padding: theme.spacing(2),
      width: theme.spacing(60),
    },
    field: {
      width: "100%",
      padding: theme.spacing(0.5, 1),
    },
    slider: {
      marginTop: theme.spacing(4.5),
    },
  })
);

export const LogCreditsDialog: FC<ILogCreditsDialogProps> = ({ open, setOpen, creditsService, ticket, onClose }) => {
  const styles = useStyles();

  const [mode, setMode] = useState<"loading" | "ready">("ready");
  const [productFamily, setProductFamily] = useState<string>(ProductFamily.Experience.toString());
  const [subject, setSubject] = useState<string>("");
  const [date, setDate] = useState<Moment>(moment());
  const [credits, setCredits] = useState<number>(1);
  const [time, setTime] = useState<number>(experience.minCreditTaskTime);
  const [manuallySetTime, setManuallySetTime] = useState(false);
  const [creditTaskLogged, setCreditTaskLogged] = useState(false);

  const crmService = useDependency(ICrmService);
  const crmServiceCache = useDependency(ICrmServiceCache);

  const latestServiceTask = useSubscriptionEffect(() => {
    if (creditTaskLogged) {
      return crmService
        .serviceTasks()
        .select("activityid")
        .filter(`_regardingobjectid_value eq ${creditsService.ken_serviceid}`)
        .top(1)
        .orderBy("modifiedon desc")
        .getObservable();
    }
  }, [creditTaskLogged, creditsService.ken_serviceid])?.[0];

  useAsyncEffect(async () => {
    if (latestServiceTask) {
      await crmService.serviceTasks().upsert(latestServiceTask.activityid, {
        statecode: ServiceTaskStatus.Completed,
      });

      await crmService.services().upsert(creditsService.ken_serviceid, {
        ken_remainingcredits: creditsService.ken_remainingcredits - credits,
      });

      await wait(1000);

      crmServiceCache.refresh("ken_services");

      setOpen(false);
      setMode("ready");
      setProductFamily(ProductFamily.Experience.toString());
      setSubject("");
      setDate(moment());
      setCredits(1);
      setTime(experience.minCreditTaskTime);
      setManuallySetTime(false);
      setCreditTaskLogged(false);
    }
  }, [latestServiceTask, crmService, crmServiceCache]);

  const logCreditTask = useCallback(async () => {
    setMode("loading");

    await crmService.serviceTasks().insert({
      ken_productfamily: parseInt(productFamily),
      subject: subject,
      ken_date: new Date(date.toISOString()),
      ken_credits: credits,
      ken_taskactualtime: time,
      statecode: ServiceTaskStatus.Completed,
      "ken_taskconsultantid_ken_servicetask@odata.bind": `/systemusers(${ticket.owninguser?.systemuserid})`,
      "ownerid@odata.bind": `/systemusers(${ticket.owninguser?.systemuserid})`,
      "regardingobjectid_ken_service@odata.bind": `/ken_services(${creditsService.ken_serviceid})`,
      "ken_Case_ken_servicetask@odata.bind": `/incidents(${ticket.incidentid})`,
    });

    await wait(1000);

    setCreditTaskLogged(true);
  }, [productFamily, subject, date, credits, time, ticket.owninguser, ticket.incidentid, creditsService.ken_serviceid, crmService]);

  return (
    <Dialog open={open} onClose={onClose}>
      {mode === "loading" && <Loading overlay />}
      <Grid className={styles.fields} container direction="column">
        <Box className={styles.field}>
          <TicketsFilterField
            label={account.productFamily}
            options={entityNames.productFamily}
            value={productFamily}
            setValue={(value) => setProductFamily(value ? value : ProductFamily.Experience.toString())}
          />
        </Box>
        <Box className={styles.field}>
          <TextField
            fullWidth
            label={account.credits.creditTaskSubject}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            error={subject === ""}
          />
        </Box>
        <Box className={styles.field}>
          <MuiPickersUtilsProvider utils={MomentUtils}>
            <KeyboardDatePicker
              disableToolbar
              disableFuture
              variant="inline"
              format="LL"
              margin="dense"
              label={account.credits.creditTaskDate}
              value={date}
              onChange={(value) => setDate(value ? value : moment())}
              KeyboardButtonProps={{
                "aria-label": account.credits.creditTaskDate,
              }}
            />
          </MuiPickersUtilsProvider>
        </Box>
        <Box className={styles.field}>
          <Typography variant="caption">
            {format(
              account.credits.creditTaskCredits,
              creditsService.ken_credits.toString(),
              creditsService.ken_remainingcredits.toString()
            )}
          </Typography>
          <Slider
            min={1}
            max={creditsService.ken_remainingcredits}
            className={styles.slider}
            valueLabelDisplay="on"
            value={credits}
            onChange={(_event, value) => {
              setCredits(value as number);
              (!manuallySetTime || time === 0) && setTime((value as number) / 2);
            }}
          />
        </Box>
        <Box className={styles.field}>
          <Typography variant="caption">{account.credits.creditTaskTime}</Typography>
          <Slider
            min={experience.minCreditTaskTime}
            max={experience.maxCreditTaskTime}
            step={0.25}
            className={styles.slider}
            valueLabelDisplay="on"
            value={time}
            onChange={(_event, value) => {
              setTime(value as number);
              setManuallySetTime((value as number) > 0);
            }}
          />
        </Box>
        <Box className={styles.field}>
          <Button variant="contained" color="primary" onClick={async () => await logCreditTask()} disabled={subject === ""}>
            {account.credits.logCreditTask}
          </Button>
        </Box>
      </Grid>
    </Dialog>
  );
};

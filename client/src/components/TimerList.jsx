import { Alert, Box, Button, Card, CardActions, Checkbox, CircularProgress, Dialog, List, ListItem, Stack, TextField, Typography } from "@mui/material"
import { useAddTimerMutation, useGetLightChannelsQuery, useGetTimersQuery, useRemoveTimerMutation, useSetStepsMutation, useSetStepTimeMutation, useSetSunriseTimeMutation, useSetSunsetTimeMutation, useStartTimerMutation, useStopTimerMutation, useSubscribeMutation, useUnsubscribeMutation } from "../store/lightApi"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from 'dayjs';
import { useEffect, useState } from "react";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import PropTypes from 'prop-types';

const includes=(arr1,arr2)=>{
  return arr2.every((item)=>arr1.includes(item));
}
const minutesToDate=(minutes)=>{
  const date=new Date();
  date.setHours(Math.floor(minutes/60));
  date.setMinutes(minutes%60);
  return date;
}
const dateToMinutes=(date)=>{
  return date.getHours()*60+date.getMinutes();
}

const TimerSettings=({timer})=>{
  const {name,steps,stepTime,sunriseTime,sunsetTime}=timer;
  const [setSteps]=useSetStepsMutation();
  const [setStepTime]=useSetStepTimeMutation();
  const [setSunriseTime]=useSetSunriseTimeMutation();
  const [setSunsetTime]=useSetSunsetTimeMutation();
  const [haveModifications,setHaveModifications]=useState(false);
  const [openDialog,setOpenDialog]=useState(false);
  const [settings,setSettings]=useState({steps,stepTime,sunriseTime:minutesToDate(sunriseTime),sunsetTime:minutesToDate(sunsetTime)});



  const handleSetSteps=(e)=>{
    setSettings({...settings,steps:parseInt(e.target.value)});
  }
  const handleSetStepTime=(e)=>{
    setSettings({...settings,stepTime:parseInt(e.target.value)});
  }
  const handleSetSunriseTime=(date)=>{
    setSettings({...settings,sunriseTime:date.toDate()});
  }
  const handleSetSunsetTime=(date)=>{
    setSettings({...settings,sunsetTime:date.toDate()});
  }
  const handlerSave=()=>{
    if(settings.steps!==steps){
      setSteps({name,steps:settings.steps});
    }
    if(settings.stepTime!==stepTime){
      setStepTime({name,stepTime:settings.stepTime});
    }
    if(settings.sunriseTime!==sunriseTime){
      setSunriseTime({name,time:dateToMinutes(settings.sunriseTime)});
    }
    if(settings.sunsetTime!==sunsetTime){
      setSunsetTime({name,time:dateToMinutes(settings.sunsetTime)});
    }
    setOpenDialog(false);
  }

  useEffect(()=>{
    if(settings.steps!==steps||settings.stepTime!==stepTime||settings.sunriseTime!==sunriseTime||settings.sunsetTime!==sunsetTime){
      setHaveModifications(true);
    }else{
      setHaveModifications(false);
    }
  }
  ,[settings,steps,stepTime,sunriseTime,sunsetTime])
  return(
    <>
    <Button
      variant="contained"
      color="primary"
      onClick={()=>setOpenDialog(true)}
    >Settings</Button>
    <Dialog
      open={openDialog}
      onClose={()=>setOpenDialog(false)}
    >
      <Stack
        direction="column"
        spacing={2}
        margin={2}
      >
        <TextField
          label="Steps"
          variant="outlined"
          type="number"
          value={steps}
          onChange={handleSetSteps}
        />
        <TextField
          label="Step Time"
          variant="outlined"
          type="number"
          value={stepTime}
          onChange={handleSetStepTime}
        />
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
          <TimePicker
            label="Sunrise Time"
            ampm={false}
            value={dayjs(minutesToDate(settings.sunriseTime))}
            onChange={handleSetSunriseTime}
            renderInput={(params)=><TextField {...params}/>}
          />
          <TimePicker
            label="Sunset Time"
            ampm={false}
            value={dayjs(minutesToDate(settings.sunsetTime))}
            onChange={handleSetSunsetTime}
            renderInput={(params)=><TextField {...params}/>}
          />
        </LocalizationProvider>
        <pre 
        style={{overflow:"auto",maxHeight:"200px",fontSize:"10px"}}
        >{JSON.stringify(settings,null,2)}</pre>
        <Button
          variant="contained"
          color="primary"
          disabled={!haveModifications}
          onClick={handlerSave}
        >Save</Button>
        <Button 
          variant="contained"
          color="error"
          onClick={()=>setOpenDialog(false)}
        >Close</Button>
      </Stack>
    </Dialog>
    </>
  )
}
TimerSettings.propTypes={
  timer:PropTypes.object.isRequired
}




const TimerCard=({timer})=>{
  const {name,steps,stepTime,sunriseTime,sunsetTime,state,channels}=timer;
  const [removeTimer]=useRemoveTimerMutation();
  const {data:availbleChannels}=useGetLightChannelsQuery();
  const [channelsList,setChannelsList]=useState([...channels]);
  const [unsubscribeList,setUnsubscribeList]=useState([]);  
  const [openDialog,setOpenDialog]=useState(false);
  const [haveModifications,setHaveModifications]=useState(false);
  const [subscribe]=useSubscribeMutation();
  const [unsubscribe]=useUnsubscribeMutation();
  const [starTimer]=useStartTimerMutation();
  const [stopTimer]=useStopTimerMutation();
  const handleRemoveTimer=()=>{
    removeTimer(name);
  }
  const handleStartTimer=()=>{
    starTimer({name});
  }
  const handleStopTimer=()=>{
    stopTimer({name});
  }

  const isRunning=state==="started";
  const handlerSubcribe=()=>{
    if(channelsList.length>0&&!includes(channels,channelsList)){
      subscribe({name,channels:[...channelsList]});
    }
    if(unsubscribeList.length>0){
      unsubscribe({name,channels:[...unsubscribeList]});
    }
    setChannelsList([...channels]);
    setUnsubscribeList([]);
    setOpenDialog(false);
  }
  useEffect(()=>{
    if(!includes(channels,channelsList)||unsubscribeList.length>0){
      setHaveModifications(true);
    }else{
      setHaveModifications(false);
    }
  },[channelsList,unsubscribeList])

  return(
    <>
    <Card
    sx={{m:2,p:2}}
    >
      {name&&<Typography  >Name:{name||""}</Typography>}
      {steps&&<Typography>Steps:{steps||""}</Typography>}
      {stepTime&&<Typography>stepTime{stepTime||""}</Typography>}
      {sunriseTime&&<Typography>Sunrise{dayjs(minutesToDate(sunriseTime)).format("HH:mm").toString()||""}</Typography>}
      {sunsetTime&&<Typography>Sunset{dayjs(minutesToDate(sunsetTime)).format("HH:mm").toString()||""}</Typography>}
      {state&&<Typography>State:{state||""}</Typography>}

    
    <CardActions>
      <Button
        variant="contained"
        color="error"
        onClick={handleRemoveTimer}
      >Delete</Button>
      <Button
        variant="contained"
        color="primary"
        onClick={()=>setOpenDialog(true)}
      >Subscribe Channel</Button>
      <Button
        variant="contained"
        color="primary"
        disabled={isRunning}
        onClick={handleStartTimer}
      >Start</Button>
      <Button
        variant="contained"
        color="primary"
        disabled={!isRunning}
        onClick={handleStopTimer}
      >Stop</Button>
      <TimerSettings timer={timer}/>
    </CardActions>
    </Card>
    <Dialog
      open={openDialog}
      onClose={()=>setChannelsList([])}
    >
      <Stack
        direction="column"
        spacing={2}
        margin={2}  
      >
        <List>
        {availbleChannels?.length>0&&availbleChannels.map((channel,idx)=>(
          <ListItem
            key={idx}
            variant="contained"
            color="primary"
          >{channel.name}
          <Checkbox
            checked={channelsList.includes(channel.name)}
            onChange={(e)=>{
              if(e.target.checked){
                if(channelsList.includes(channel.name)||channels.includes(channel.name)){
                  return;
                }
                setChannelsList([...channelsList,channel.name]);
                if(unsubscribeList.includes(channel.name)){
                  setUnsubscribeList(unsubscribeList.filter((item)=>item!==channel.name));
                }
              }else{
                setChannelsList(channelsList.filter((item)=>item!==channel.name));
                setUnsubscribeList([...unsubscribeList,channel.name]);
              }
            }}
          />
          </ListItem>
        ))}
        </List>
        <pre
        style={{overflow:"auto",maxHeight:"200px",fontSize:"10px"}}
        >{JSON.stringify(channelsList,null,2)}</pre>
        <pre
        style={{overflow:"auto",maxHeight:"200px",fontSize:"10px"}}
        >{JSON.stringify(unsubscribeList,null,2)}</pre>
        <Button
          disabled={!haveModifications}
          variant="contained"
          color="primary"
          onClick={handlerSubcribe}
        >Subscribe</Button>
        <Button
          variant="contained"
          color="error"
          onClick={()=>setOpenDialog(false)}
        >Close</Button>
      </Stack>
    </Dialog>

    </>
  )
}
TimerCard.propTypes={
  timer:PropTypes.object.isRequired
}


export default function TimerList(){  
  const {data:timers,isLoading,isError,error}=useGetTimersQuery();
  const [newTimer,setNewTimer]=useState({name:"",steps:0,stepTime:0,sunriseTime:"",sunsetTime:"",channels:[]});
  const [addTimer]=useAddTimerMutation();
  

  const handleAddTimer=()=>{
    addTimer(newTimer);
    setNewTimer({name:"",steps:0,stepTime:0,sunriseTime:0,sunsetTime:0,channels
    :[]});
  };

  return(
   
    <Box>
 {isLoading && <CircularProgress />}
 {isError && <Alert severity="error">{error.message}</Alert>}
 {timers?.length>0&&timers.map((timer,idx)=>(<TimerCard key={idx} timer={timer}/>))

 }
    <Stack
      direction="row"
      spacing={2}
      margin={2}

    >
      <TextField
        label="Name"
        variant="outlined"
        sx={{width:"400px"}}  
        value={newTimer.name}
        onChange={(e)=>setNewTimer({...newTimer,name:e.target.value})}
      />
      <TextField
        label="Steps"
        variant="outlined"
        type="number"
        value={newTimer.steps}
        onChange={(e)=>setNewTimer({...newTimer,steps:parseInt(e.target.value)})}
      />
      <TextField
        label="Step Time"
        variant="outlined"
        type="number"
        value={newTimer.stepTime}
        onChange={(e)=>setNewTimer({...newTimer,stepTime:parseInt(e.target.value)})}
      />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
        <TimePicker
          label="Sunrise Time"
          ampm={false}
          value={dayjs(newTimer.sunriseTime)}
          onChange={(date)=>setNewTimer({...newTimer,sunriseTime:date.toDate()})}
          renderInput={(params)=><TextField {...params}/>}
        />
        <TimePicker
          label="Sunset Time"
          ampm={false}
          value={dayjs(newTimer.sunsetTime)}
          onChange={(date)=>setNewTimer({...newTimer,sunsetTime:date.toDate()})}
          renderInput={(params)=><TextField {...params}/>}
        />
      </LocalizationProvider>
      <Button
        variant="contained"
        color="primary"
        onClick={handleAddTimer}
      >Add</Button>
      </Stack>
    </Box>
  )
}

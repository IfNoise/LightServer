import { Alert, Box, Button, Card, CircularProgress, Divider, MenuItem, Select, Slide, Slider, Stack, TextField, Typography } from "@mui/material";
import { useAddChannelMutation, useGetDevicesQuery, useGetLightChannelsQuery, useGetLightChannelStateQuery, useRemoveChannelMutation, useSetMaxLevelMutation } from "../store/lightApi";
import { useEffect, useState } from "react";
import PropTypes from 'prop-types';

function valuetext(value) {
  return `${value}%`;
}


const ChannalCard=({channel})=>{
  const {name,device,port,maxLevel}=channel;
  const [maxValue,setMaxValue]=useState((maxLevel/32767*100));
  const {data:state}=useGetLightChannelStateQuery(name,{
    pollingInterval:100000
  });
  const [setMaxLevel]=useSetMaxLevelMutation();

  useEffect(()=>{
    setMaxValue((maxLevel/32767*100))
  },[maxLevel])

  
  const[removeChannel]=useRemoveChannelMutation();
  const handleRemoveChannel=()=>{
    removeChannel(name);
  }
  return(
    <Card 
    sx={{
      m:"4px",
      p:"8px",
      display:"flex",
      flexDirection:"column",
      width:"290px"
    }}  
    >
      <Stack direction="row" spacing={1}>
      <Box>
      <Typography variant="body">{name}</Typography>
      <Typography variant="caption" component={'div'} >{device||""}:{port||0}</Typography>
      </Box>
      {state?.state&&<Typography variant="h6" sx={{backgroundColor:"#a6a6ff",color:"blue",borderRadius:"20%",px:"5px"}}>Brigth:{Math.floor(state.state/32767*100)}%</Typography>}
      <Button
        variant="contained"
        color="error"
        size="small"
        sx={{
          maxWidth: '25px', maxHeight: '25px', minWidth: '25px', minHeight: '25px',
          borderRadius:"50%",
          p:"0px",
          ml:"30px"
        }}
        onClick={handleRemoveChannel}
      >X</Button>
      </Stack>
      <Slider
      sx={{
        width:"90%",
        ml:"10px"
      }}
      size="small"
      getAriaLabel={() => 'Minimum distance'}
      valueLabelDisplay="auto"
      getAriaValueText={valuetext}
      disableSwap
        min={0}
        max={100}
        value={maxValue ||0}
        onChange={(e )=>setMaxValue(e.target.value)}
        onChangeCommitted={(e)=>{
          console.log(e)
          setMaxLevel({name,maxLevel:maxValue})
         
      }}
      />
      
    </Card>
  )
}
ChannalCard.propTypes={
  channel:PropTypes.object.isRequired
} 


export default function ChannelsList() {
  const {data:channels,isLoading,isSuccess,isError,error}=useGetLightChannelsQuery({
    
  })
  const {data:devices}=useGetDevicesQuery();
  const [newChannel,setNewChannel]=useState({name:"",device:"",port:""});
  const [addChannel]=useAddChannelMutation();


  return(
    <Box>
      <Typography variant="h4">Channels</Typography>
      {isLoading && <CircularProgress />}
      {isError && <Alert severity="error">{error.message}</Alert>}
      <Stack direction="row" useFlexGap flexWrap={"wrap"}  spacing={1}>
      {isSuccess&& channels?.map((channel,idx)=><ChannalCard key={idx} channel={channel}/>)}
      </Stack>
      <Divider/>
      <Typography variant="h6">Add Channel</Typography>
      <TextField
        label="Name"
        required
        value={newChannel.name}
        onChange={(e)=>setNewChannel({...newChannel,name:e.target.value})}
      />
      <Select
        label="Device"
        required
        value={newChannel.device}
        onChange={(e)=>setNewChannel({...newChannel,device:e.target.value})}
      >
        {devices?.length>0 && devices.map((device,idx)=><MenuItem key={idx} value={device.name}>{device.name}</MenuItem>)}
      </Select>
      <Select
        label="Port"
        required
        value={newChannel.port}
        onChange={(e)=>setNewChannel({...newChannel,port:e.target.value})}
      >
        {devices?.length>0 && devices.find((device)=>device.name===newChannel.device)?.ports?.map((port,idx)=><MenuItem key={idx} value={idx}>{`${idx}:${port}`}</MenuItem>)} 
      </Select>
      <Button
        variant="contained"
        color="primary"
        onClick={()=>addChannel(newChannel)}
      >Add</Button>
      
    </Box>
  )

}


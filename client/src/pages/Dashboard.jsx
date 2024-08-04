import { Alert, Box, Button, CircularProgress, Divider, Stack, TextField } from "@mui/material";
import DeviceCard from "../components/DeviceCard";
import {  useState } from "react";
import { useGetDevicesQuery,useAddDeviceMutation } from "../store/lightApi";
import ChannelsList from "../components/ChannelsList";
import TimerList from "../components/TimerList";

const Dashboard=()=>{
  const {data:devices,isLoading,isError,error}=useGetDevicesQuery({
    refetchOnMount:true,
    refetchOnReconnect:true,
    refetchOnFocus:true,
    refetchOnWindowFocus:true,
    refetchOnVisiblityChange:true
  } );
  const [addDevice]=useAddDeviceMutation();
  const [newDevice,setNewDevice]=useState({name:"",address:"",port:""});
  const handleAddDevice=()=>{
    const {name,address,port}=newDevice;
    if(!name || !address || !port){
      return;
    }else{
      addDevice({name,address,port});
      setNewDevice({name:"",address:"",port:""});
    }
  }
 
  return(
    <Box>
      {isLoading && <CircularProgress />}
      {isError && <Alert severity="error">{error.message}</Alert>}
      <Stack
      sx={{m:2}}
      spacing={1}
      direction="row">
      { devices?.length>0 && devices.map((device,idx)=><DeviceCard key={idx} device={device}/>)}
      </Stack>
      <Stack 
      sx={{m:2}}
      spacing={1}
      direction="row"
      >
        <TextField
          label="Name"
          required
          value={newDevice.name}
          onChange={(e)=>setNewDevice({...newDevice,name:e.target.value})}
        />
        <TextField
          label="Address"
          required
          value={newDevice.address}
          onChange={(e)=>setNewDevice({...newDevice,address:e.target.value})}
        />
        <TextField
          label="Port"
          required
          value={newDevice.port}
          onChange={(e)=>setNewDevice({...newDevice,port:e.target.value})}
        />
      </Stack>
      <Button
      onClick={
        handleAddDevice
      }
      >Add Device</Button>
      <Divider/>
      <ChannelsList/>
      <TimerList/>
    </Box>
  )
}

export default Dashboard;
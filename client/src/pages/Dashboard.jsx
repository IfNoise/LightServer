import { Alert, Box, CircularProgress } from "@mui/material";
import { useGetStateQuery } from "../store/lightApi";
import DeviceCard from "../components/DeviceCard";
import { useEffect } from "react";

const Dashboard=()=>{
  const { isLoading, isError, error, data,refetch } = useGetStateQuery(
    { refetchOnMountOrArgChange: true, refetchOnFocus: true }
  );
 useEffect(() => {refetch()},[])
  return(
    <Box sx={{display:"flex"}}>
      <h1>Dashboard</h1>
      {isError && <Alert severity="error">{error.message}</Alert>}
      {isLoading && <CircularProgress />}
      {
        data?.state?.devices.map((device,index) => (
          <DeviceCard key={index} device={device} />
        ))
      }
    </Box>
  )
}

export default Dashboard;
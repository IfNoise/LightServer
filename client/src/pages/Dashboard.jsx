import { Alert, Box, CircularProgress } from "@mui/material";
import { useGetStateQuery } from "../store/lightApi";
import DeviceCard from "../components/DeviceCard";

const Dashboard=()=>{
  const { isLoading, isError, error, data } = useGetStateQuery(
    { refetchOnMountOrArgChange: true, refetchOnFocus: true }
  );

  return(
    <Box sx={{display:"flow"}}>
      <h1>Dashboard</h1>
      {isError && <Alert severity="error">{error.message}</Alert>}
      {isLoading && <CircularProgress />}
      {
        data?.state?.devices.map((device) => (
          <DeviceCard key={device.address} device={device} />
        ))
      }
    </Box>
  )
}

export default Dashboard;
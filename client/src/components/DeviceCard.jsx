import { Button, Card, CardActions, CardContent, CardHeader, Stack, Typography } from "@mui/material";
import PropTypes from "prop-types";

const DeviceCard = ({ device }) => {
  const { address, name, ports } = device;

  return (
    <Card>
      <CardHeader title={name} /> 
      <CardContent>
        <Typography variant="body2" color="textSecondary" component="p">Address {address}</Typography>
        <Stack spacing={2}>
          {ports.map((port,index) => (
            <Card key={index}>
              <CardContent>
                <Typography variant="body2" color="textSecondary" component="p">Port {port.name}</Typography>
                <Typography variant="body2" color="textSecondary" component="p">Day Brightness {port.dayBrightness}</Typography>
                <Typography variant="body2" color="textSecondary" component="p">State {port.state}</Typography>
                <Typography variant="body2" color="textSecondary" component="p">Timer {port.timer}</Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  variant="contained"
                  color="primary">settings</Button>
              </CardActions>
            </Card>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

DeviceCard.propTypes={
  device: PropTypes.object.isRequired,
}

export default DeviceCard;
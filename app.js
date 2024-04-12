const express = require("express");
const app = express();
const cors = require("cors");
const port = 3000;
const ModbusDevice = require("./models/ModbusDevice");
const bodyParser = require("body-parser");
const Device=new ModbusDevice("Device 1","192.168.31.166")
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json({ extended: true }));

app.get("/api/state", async(req, res) => {
  const ports=await Device.requestState();
  console.log('ports',ports)
  
          res.json({
          state: {
            devices: [
              {
                name: Device.name,
                address: Device.options.host,
                ports: ports.map((level,index)=>{return { name: `Port ${index}`,dayBrightness:16000, state: level,timer:"Timer1" }}),
              },
            ],
          },
        });
});
app.post("/api/update", (req, res) => {
  console.log(req.body);
  res.json({ state: [] });
});
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

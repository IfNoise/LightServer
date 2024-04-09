const express = require("express");
const app = express();
const cors = require("cors");
const port = 3000;
const modbus = require("jsmodbus");
const net = require("net");

const bodyParser = require("body-parser");
const options = {
  host: "192.168.31.166",
  port: "502",
  timeout: 1000,
};
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json({ extended: true }));

app.get("/api/state", (req, res) => {
  // const socket = new net.Socket();
  // const client = new modbus.client.TCP(socket);
  // socket.on("connect", function () {
  //   client
  //     .readHoldingRegisters(0, 8)
  //     .then(function (resp) {
  //       //res.json({state:resp.response._body.valuesAsArray})
        res.json({
          state: {
            devices: [
              {
                name: "Device 1",
                address: "192.168.31.160",
                ports: [
                  { name: "Port 1",dayBrightness:16000, state: 16000,timer:"Timer1" },
                  { name: "Port 2",dayBrightness:16000, state: 16000,timer:"Timer1"  },
                  { name: "Port 3",dayBrightness:16000, state: 16000,timer:"Timer1"  },
                  { name: "Port 4",dayBrightness:16000, state: 16000,timer:"Timer1"  },
                  { name: "Port 5",dayBrightness:16000, state: 16000,timer:"Timer1"  },
                  { name: "Port 6",dayBrightness:16000, state: 16000,timer:"Timer1"  },
                  { name: "Port 7",dayBrightness:16000, state: 16000 ,timer:"Timer1" },
                  { name: "Port 8",dayBrightness:16000, state: 16000 ,timer:"Timer1" },
                ],
              },
              {
                name: "Device 2",
                address: "192.168.31.166",
                ports: [
                  { name: "Port 1",dayBrightness:16000, state: 16000,timer:"Timer2" },
                  { name: "Port 2",dayBrightness:16000, state: 16000,timer:"Timer2" },
                  { name: "Port 3",dayBrightness:16000, state: 16000,timer:"Timer2" },
                  { name: "Port 4",dayBrightness:16000, state: 16000,timer:"Timer2" },
                  { name: "Port 5",dayBrightness:16000, state: 16000,timer:"Timer2" },
                  { name: "Port 6",dayBrightness:16000, state: 16000,timer:"Timer2" },
                  { name: "Port 7",dayBrightness:16000, state: 16000,timer:"Timer2" },
                  { name: "Port 8",dayBrightness:16000, state: 16000,timer:"Timer2" },
                ],
              }
            ],
            timers:[
              {name:"Timer 1",dawn:12,sunset:0,},
              {name:"Timer 2",dawn:12,sunset:0,}

            ]
          },
        });
  //       socket.end();
  //     })
  //     .catch(function () {
  //       res.json({ state: [] });
  //       socket.end();
  //     });
  // });
  // socket.connect(options);
});
app.post("/api/update", (req, res) => {
  console.log(req.body);
  res.json({ state: [] });
});
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

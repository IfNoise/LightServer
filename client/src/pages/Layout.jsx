import { Outlet, Link, Navigate, useLocation } from "react-router-dom";
import * as React from "react";
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import CssBaseline from "@mui/material/CssBaseline";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import MailIcon from "@mui/icons-material/Mail";
import SearchIcon from "@mui/icons-material/Search";
import SnackBar from "../components/SnackBar/SnackBar";

function PrivateOutlet() {
  const { isAuth } = useAuth();
  const location = useLocation();

  return isAuth ? (
    <Outlet />
  ) : (
    <Navigate to="/auth" state={{ from: location }} />
  );
}

export const Layout = () => {

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      {/* <MuiAppBar position="fixed"  >
        <Toolbar sx={{width:'100%'}}>
            
        </Toolbar>
       </MuiAppBar> */}
      <Box>
        <Outlet />
        </Box>
        <SnackBar />
    </Box>
  );
};

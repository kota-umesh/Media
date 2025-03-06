import { FacebookOutlined, TwitterOutlined, LinkedinOutlined, YoutubeOutlined, InstagramOutlined } from "@ant-design/icons";
import { connectFacebook } from "../services/facebookServices";


export const platforms = [
  { name: "Facebook", icon: <FacebookOutlined />, connect: "Connect Page", action: connectFacebook },
  { name: "Twitter", icon: <TwitterOutlined />, connect: "Connect Profile", action: null },
  { name: "LinkedIn", icon: <LinkedinOutlined />, connect: "Connect Profile", action: null },
  { name: "YouTube", icon: <YoutubeOutlined />, connect: "Connect Channel", action: null },
  { name: "Instagram", icon: <InstagramOutlined />, connect: "Connect Business", action: null },
];

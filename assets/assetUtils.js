import{i as r,g as e}from"./main.js";function i(s){if(s.startsWith("/")||(s="/"+s),r()){const t=s.startsWith("/")?s.substring(1):s;return e()+t}return s}function u(s){return i(`sounds/${s}`)}export{i as getAssetUrl,u as getSoundUrl};

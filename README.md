# tesi.triennale.alberti - ROS2 Teleop Webapp
ROS2 Secure Teleoperation Web App.  
## Description
This project lets you teleop a ROS2 robot in the same network or across the Internet using the WebRTC API for the video streaming.  
The App consists of two Node.js servers: 
- Server_Teleop is the main server: it ensures users and robots authentication and offers signaling service for WebRTC. 
- Local_Server_Teleop is the local server: it is needed for the robot's login and for executing the teleop commands.   

The robots need to have a Webcam (not used as a sensor in ROS) for WebRTC.  
The App was tested with Node.js 16.x, ROS Galactic Geochelone and a Turtlebot3 model Burger using a Raspberry Pi 4 4Gb with a USB Webcam.

## Why this app
ROS2 offers a set of tools called SROS2 used for enabling security between the ROS nodes.  
This App shows how to make a secure ROS application in the local network with the use of SROS2.   
Previously in ROS1 the ROS Master was a vulnerability himself and the only way to make a ROS application secure in the local network was to isolate the Master and the other nodes (usually this was done using a Firewall). Isolating is not the solution of this security problem and this is the reason why SROS2 exists.  
With SROS2 you can make nodes speak to each other with private encrypted channels (actually you can do much more: [sros2 guide](https://github.com/ros2/sros2))

## Features
### Server Teleop Features:
- Teleoperation in Real time with video feed using WebRTC
- Multiple users connected to different robots (a robot can be controlled only by one user at the same time)
- Control the robot with a mouse (or touch screen), a keyboard or a gamepad
- Authentication and Access Control (users may operate only if they have the right privilege)
- Admin Webpage for managing the users (create, delete, update privileges and view list of users)
- Protection against common attacks: XSS, CSFR, DOS and SQLi
- Support for different models of robots that you can define

### Local Server Teleop Features:
- Headless web browser for logging into the Server Teleop
- No secret stored in the robot
- Support for SROS2
- Teleoperation of the robot
- Send to the User the remaining Battery and the Map (you can also request the robot to save it)

![Diagram](/diagram.png)

## ROS Technologies
For interacting with the ROS system the user uses only Rclnodejs by Robot Web Tools.  
ROSbridge was not used because of two reasons: 
- It is hard to test the security of that tool (see also [this](https://github.com/RobotWebTools/rosbridge_suite/issues/570))
- With ROSbridge the client has full access of the robot (via Javascript).

With Rclnodejs you can restrict what a user can do.

## Installation
See the guides in Server Teleop and Local Server Teleop folders.

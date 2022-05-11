# tesi.triennale.alberti - ROS2 Teleop Webapp
ROS2 Teleoperation Web App with support for SROS2.

## Overview
The App consists of two servers: 
- Server_Teleop is the main server with Authentication and Signaling Service for WebRTC. 
- Local_Server_Teleop is the local server that needs to be executed on the robot. 

The Server_Teleop lets you define different models of robots with different settings.

The robots need to have a Webcam (not used as a sensor in ROS) for WebRTC.

For installing the App see the installation guide in the folders.

The App was tested with Node.js 16.x, ROS Galactic Geochelone and a Turtlebot3 model Burger using a Raspberry Pi 4 4Gb with a USB Webcam.

## Why this app
ROS2 offers a set of tools called SROS2 used for enabling security between the ROS nodes.

This App shows how to make a secure ROS application in the local network with the use of SROS2. 

Previously in ROS1 the ROS Master was a vulnerability himself and the only way to make a ROS application secure in the local network was to isolate the Master and the other nodes (usually this was done using a Firewall). Isolating is not the solution of this security problem, and this is the reason why SROS2 exists.

With SROS2 you can make nodes speak to each other with private encrypted channels (actually you can do much more: https://github.com/ros2/sros2)

## ROS Technologies
For interacting with the ROS system the user uses only Rclnodejs by Robot Web Tools.

ROSbridge was not used because of two reasons: 
- It is hard to test the security of that tool (see https://github.com/RobotWebTools/rosbridge_suite/issues/570)
- With ROSbridge the client has full access of the Robot (via Javascript).

With Rclnodejs you can restrict what a user can do.

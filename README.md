# tesi.triennale.alberti - ROS2 Teleop Webapp
ROS2 Teleoperation Web App with support for SROS2.

The App consists of two servers: Server_Teleop is the main server with Authentication and Signaling Service for WebRTC, Local_Server_Teleop is the local server that needs to be executed on the robot. The Server_Teleop let you define different models of robots with different settings. The robots need to have a Webcam (not used as a sensor in ROS) for WebRTC.

For installing the App see the installation guide in the folders.

The App was tested with Node.js 16.x, ROS Galactic Geochelone and a Turtlebot3 model Burger using a Raspberry Pi 4 4Gb with a USB Webcam.

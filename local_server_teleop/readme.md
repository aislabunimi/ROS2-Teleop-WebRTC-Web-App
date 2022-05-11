# Installation Guide
1. Install Ubuntu 20.04 Server into the Robot. If you want you can use the GUI version.
2. Install ROS2 Galactic Geochelone (should also work with Foxy Fitzroy). Add to the bash the source command
by using the command  ``` sudo nano ~/.bashrc  ``` and insert at the end of the file the following line:  ``` source /opt/ros/galactic/setup.bash  ```
(swap galactic with the name of your ros2 distro)

3. Download the repo
4. Install Node.js version 16.x.
5. Install the project with ```npm install ```. Puppeteer may show a error asking you to install chromium. If so, use the command that shows up (probabily  ``` sudo apt install chromium-browser  ```)
7. Edit the .env file with right values
8. Run the server with the command:  ``` node server.js  ```. After you run it you need to type Username and Password of the robot (the robot must be registered in the Server Teleop). You'll see a Auth Ok message.

## Setting Up SROS2 Keystore

```bash
mkdir sros2_dir   #this command creates the directory where you are gonna create the keystore
cd sros2_dir
ros2 security create_keystore demo_keystore   #demo_keystore is the name of the keystore, you can change it
ros2 security create_enclave demo_keystore /tbot3/turtlebot3_node  
# demo_keystore is the keystore where sros2 is gonna create the enclave. 
# sros2tbot3 is the folder of the sros2 project, choose the name you want.
# turtlebot_node is the enclave for the single ROS2 node in the project. 
# Every node must have is own enclave
```
**Repeat** the last command for every node of the system, using the same sros2 project folder (in the example sros2tbot3).

## Using SROS2 in a Robot
For using SROS2 in a robot, you need to locate the launch files. The folder may be your project workspace or the default  ``` /opt/ros/galactic/share/package_name/launch  ```.

Every .launch files that you execute when you initialize the robot needs to be modified.
Open the .launch file and search for:
```python
IncludeLaunchDescription(  
PythonLaunchDescriptionSource([ThisLaunchFileDir(), '/turtlebot3_state_publisher.launch.py']),  
launch_arguments={'use_sim_time': use_sim_time}.items(),
),
```

This means that your launch file includes other launch files. If they are in the same folder, in the code you find  ``` ThisLaunchFileDir()  ```.
```python
PythonLaunchDescriptionSource([lidar_pkg_dir, '/hlds_laser.launch.py']),
```

In this example the file is in the  ``` lidar_pkg_dir  ``` standard installation folder, so it is one of the folder in  ``` galactic/share  ```. 
To locate it use the bash command:

```bash
find . -name 'hlds\textunderscore laser.launch.py'
```

To actually add sros2, you need to insert to insert the argument for loading the enclave. 
After  ``` --enclave  ``` you need to put the relative path of your sros2 project and node enclave like in the example.
If arguments is not present, you can add it.

```python
Node(  
package='turtlebot3_node',  
executable='turtlebot3_ros',  
parameters=[tb3_param_dir],  
arguments=['-i', usb_port, '--ros-args', '--enclave', '/tbot3/turtlebot3_node'],  
output='screen'),
```

If you have a .launch file written in XML, here is an example

```XML
<node name="rosapi" pkg="rosapi" exec="rosapi_node" args="--ros-args --enclave /sros2/rosapi"\>
```

## Launching the node with SROS2
You should close the terminals used till now, because sometimes it doesn't source correctly the new launch files.  
You also need to create security enclave for the rclnodejs and the mapsaver node, and insert the relative path in the .env file
With a Turtlebot3, you are gonna have 7 different enclave folder in the sros2 project folder.

Now, in every terminal you need to export three variables:
```bash
export ROS_SECURITY_KEYSTORE=~/dev_ws/sros2_dir/demo_keystore   # the path to your keystore
export ROS_SECURITY_ENABLE=true   # enabling security 
export ROS_SECURITY_STRATEGY=Enforce    # set security to enforce (only nodes with valid enclaves can communicate)
```
You can also add these three commands to the bash. 

## Troubleshooting
### Performance
Because of WebRTC, the Local_server_teleop can be quite demanding in resources, especially the cpu.
With the test, the raspberry pi 3 was not enough powerful to avoid lags in local network, while the raspberry pi 4 was enough.

### SROS2 Errors

```bash
dq.builtin: Remote secure participant d740134c:e742c:51bas:1c13f not allowed
```

Try to use again the source command. If it is still present, reboot the robot.

```bash
get_security_file_URI: /home/user/dev_ws/demo_keystore/enclaves/identity_ca.cert.pem not found
```

You have inserted a wrong path. Check your launch file.

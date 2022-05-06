# Installation Guide
1. Install Ubuntu 20.04 Server into the Robot. If you want you can use the GUI version.
2. Install ROS2 Galactic Geochelone (should also work with Foxy Fitzroy). Add to the bash the source command (**sudo nano ~/.bashrc**, insert at the end **source /opt/ros/[nome distribuzione ros]/setup.bash**)
3. Download the repo
4. Install with npm install. Puppeteer may show a error asking you to install chromium. If so, use the command that shows up (probabily sudo apt install chromium-browser)
5. Edit the .env file with right values
## Setting Up SROS2 Keystore
1. **mkdir sros2_dir** (this command creates the directory where you are gonna create the keystore)
2. **cd sros2_dir**
3. **ros2 security create_keystore demo_keystore** (demo_keystore is the name of the keystore, you can change it)
4. **ros2 security create_enclave demo_keystore /tbot3/turtlebot3_node** 
(demo_keystore is the keystore where sros2 is gonna create the enclave; sros2tbot3 is the folder of the sros2 project, choose the name you want;
turtlebot_node is the enclave for the single ROS2 node in the project. Every node must have is own enclave)
5. **Repeat** the above command for every node of the system, using the same sros2 project folder (in the example sros2tbot3).
## Using SROS2 in a Robot
For using SROS2 in a robot, you need to locate the launch files. The folder may be your project workspace or the default /opt/ros/galactic/share/package_name/launch.

Every .launch files that you execute when you initialize the robot needs to be modified.
Open the .launch file and search for:
> IncludeLaunchDescription(  
> PythonLaunchDescriptionSource([ThisLaunchFileDir(), '/turtlebot3_state_publisher.launch.py']),  
> launch_arguments={'use_sim_time': use_sim_time}.items(),),

This means that your launch file includes other launch files. If they are in the same folder, in the code you find ThisLaunchFileDir().
> PythonLaunchDescriptionSource([lidar_pkg_dir, '/hlds_laser.launch.py']),

In this example the file is in the lidar_pkg_dir standard installation folder, so it is one of the folder in galactic/share. 
To locate it use the command **find . -name 'hlds\textunderscore laser.launch.py'**.

To actually add sros2, you need to insert to insert the argument for loading the enclave. 
After --enclave you need to put the relative path of your sros2 project and node enclave like in the example.
If arguments is not present, you can add it.

> Node(  
> package='turtlebot3_node',  
> executable='turtlebot3_ros',  
> parameters=[tb3_param_dir],  
> arguments=['-i', usb_port, '--ros-args', '--enclave', '/tbot3/turtlebot3_node'],  
> output='screen'),

If you have a .launch file written in XML, here is an example
> \<node name="rosapi" pkg="rosapi" exec="rosapi_node" args="--ros-args --enclave /sros2/rosapi"\>

## Launching the node with SROS2
You should close the terminals used till now, because sometimes it doesn't source correctly the new launch files.  
You also need to create security enclave for the rclnodejs and the mapsaver node, and insert the relative path in the .env file
With a Turtlebot3, you are gonna have 7 different enclave folder in the sros2 project folder.

Now, in every terminal you need to export three variables:
- **export ROS_SECURITY_KEYSTORE=~/dev_ws/sros2_dir/demo_keystore** (this is the path to your keystore).
- **export ROS_SECURITY_ENABLE=true** (enable security)
- **export ROS_SECURITY_STRATEGY=Enforce** (set it to Enforce)

You can also add these three commands to the bash.

## Troubleshooting
> dq.builtin: Remote secure participant d740134c:e742c:51bas:1c13f not allowed

Try to use again the source command. If it is still present, reboot the robot.

> get_security_file_URI: /home/user/dev_ws/demo_keystore/enclaves/identity_ca.cert.pem not found

This happens if you have inserted a wrong path. Check your launch file.

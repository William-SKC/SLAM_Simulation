%% Extend Kalman filter cooperative localization (centralized)
%% There are five robots

clear all
close all

load Barcodes.dat 
load Landmark_Groundtruth.dat
load Robot1_Groundtruth.dat
%load Robot2_Groundtruth.dat
%load Robot3_Groundtruth.dat
%load Robot4_Groundtruth.dat
%load Robot5_Groundtruth.dat

R1_G = Robot1_Groundtruth([1:10],:)

load Robot1_Measurement.dat

%load Robot2_Measurement.dat
%load Robot3_Measurement.dat
%load Robot4_Measurement.dat
%load Robot5_Measurement.dat
R1_M = Robot1_Measurement([1:10],:)
%load Robot1_Odometry.dat
%load Robot2_Odometry.dat
%load Robot3_Odometry.dat
%load Robot4_Odometry.dat
%load Robot5_Odometry.dat


state = zeros(3,5); %for each of five robots, there are x,y,r; 


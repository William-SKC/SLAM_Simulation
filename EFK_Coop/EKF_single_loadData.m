%%Extended Kalman filter 
%Basded on Cooperative Localization for Mobile Agents: A Recursive Decentralized Algorithm Base on Kalman-filter Decoupling for simulation purposes
%Shengkang Chen at UCLA 12/23/2016
clc
clear all
close all

load Barcodes.dat
load Robot1_Measurement.dat
load Robot1_Odometry.dat
load Robot1_Groundtruth.dat
load Landmark_Groundtruth.dat

num_landmark = 15;
num_state_robot = 3;
num_measurement = 2; % for range and angle 
n=num_state_robot+num_landmark*2;      %number of state for each robot: location and orientaion of the robot and location of each landmark
q=0.5;    %std of process 
r=0.1;    %std of measurement

Q=zeros(num_state_robot);
Q=q^2*eye(num_state_robot);   % covariance of process

R=r^2*eye(num_measurement);        % covariance of measurement  

deltaT = 1/10;

% nonlinear state equations 
f=@(s,i)[s(1)+deltaT*i(1)*cos(s(3)+i(2)); 
         s(2)+deltaT*i(1)*sin(s(3)+i(2)); 
         s(3)+i(1)*deltaT/33.782*sin(i(2))];
% state: s(1) is x-axis location, s(2) is y-axis location, s(3) is orientation, Input: i(1) is speed and i(2) is angular velocity 

% A_j: Jacobian matrix of partial derivatives of f
A_j = @(s, i) [ 1, 0, -deltaT*i(1)*sin(s(3)+i(2));
              0, 1, deltaT*i(1)*cos(s(3)+i(2));
              0, 0, 1];

%measurement equations
h=@(s,l)[sqrt((l(1)-s(1))^2-(s(2)-l(2))^2); 
         atan((l(2)-s(2))/(l(1)-s(1)))-s(3)];
% landmark(l): l(1) is x-axis location, l(2) is y-axis location

% H_j: Jacobian matrix of partial derivatives of h
H_j = @(s,l) [((l(1)-s(1))^2-(l(2)-s(2))^2)^(-1/2)*(l(1)-s(1)), ((l(1)-s(1))^2-(l(2)-s(2))^2)^(-1/2)*(l(2)-s(2)) , 0 
                (1+((l(2)-s(2))/(l(1)-s(1)))^2)^(-1)*((l(2)-s(2))/((l(1)-s(1)))^2), (1+((l(2)-s(2))/(l(1)-s(1)))^2)^(-1)*(-1/(l(1)-s(1))), -1];

% initial actual state
a = zeros(n,1);
a(1:3) = Robot1_Groundtruth(1,2:end);
%load landmark
a(4:2:n-1) = Landmark_Groundtruth(:,2);
a(5:2:n) = Landmark_Groundtruth(:,3);
s = a;               % initial state

P = eye(num_state_robot);                          % initial state covraiance
%N = size(Robot1_Groundtruth,1);                                     % total dynamic steps
N = 50; 
sV = zeros(3,N);        %estmate        
aV = zeros(3,N);        %actual
zV = zeros(2,N);        %measurement  

flag = 1; %% flag for searching inside Odometry later 
u = zeros(2,1);
z = zeros(2,1);

t = Robot1_Groundtruth(300,1);
for k = 1:N  
% num of iterations 
     
    
    % collect groundtruth/actual state
    loc = find(Robot1_Groundtruth(:,1)<t+deltaT & Robot1_Groundtruth(:,1)>t);
    a(1:3) = Robot1_Groundtruth(loc(end),2:4);    
    aV(:,k) = a(1:3);                           % save actual state
    
    
    %EKF time update
    
    loc = find(Robot1_Measurement(:,1)<t+deltaT & Robot1_Measurement(:,1)>t); %% find correlated time 
    if(not(isempty(loc)))
      u = Robot1_Odometry(loc(end),2:3);
    end
    s = f(s(1:3),u);
    A = A_j(s(1:3),u);
    P=A*P*A'+Q;             
    
    %EKF measurement update when there is a valid measurement
    % collect measurment data 
    loc = find(Robot1_Measurement(flag:flag+10,1)<t+deltaT & Robot1_Measurement(flag:flag+10,1)>t); %% find correlated time 
     if(not(isempty(loc)))
     flag = loc(end);
      for j = 1: size(loc)
        loc1 = find(Barcodes(6:end,2) == Robot1_Measurement(loc(j),2)); %%find the landmark number for an actual landmark
        if(not(isempty(loc1)))
            l = Landmark_Groundtruth(loc1, 2:3);          
            z = Robot1_Measurement(loc1, 3:4);
            z = z';
            z1 = h(s(1:3),l);
            H = H_j(s(1:3),l);
            
            K=P*H'*inv(H*P*H'+R);   %Kalman filter gain
            s=s+K*(z-z1);           %state estimate
            P=P-K*H*P;              %state covariance matrix        
         end
      end
    end
    
    zV(:,k) = z;  % save measurement data 
    %}
    sV(:,k) = s;  % store estimate state
    t = t+0.1;
end 

figure
  plot(aV(1,:),aV(2,:), 'r*')
  hold;
  plot(sV(1,:),sV(2,:), 'b0')
  %axis([-10 10 -10 10])
  hold off;
  


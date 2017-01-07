%%Algorithm 1 Extended Kalman filter cooperative localization (centralized)
%Basded on Cooperative Localization for Mobile Agents: A Recursive Decentralized Algorithm Base on Kalman-filter Decoupling for simulation purposes
%Shengkang Chen at UCLA 12/23/2016
clc
clear all
load Barcodes.dat
load Robot1_Measurement.dat
load Robot1_Odometry.dat
load Robot1_Groundtruth.dat
load Landmark_Groundtruth.dat

num_landmark = 15;
n=3+num_landmark*2;      %number of state for each robot: location and orientaion of the robot and location of each landmark
q=0.2;    %std of process 
r=0.2;    %std of measurement


Q=zeros(n,n);
  Q=q^2*eye(n); % covariance of process

R=r^2;        % covariance of measurement  

deltaT = 1/50;

% nonlinear state equations 
f=@(s,u)[s(1)+deltaT*s(4)*cos(s(3));s(2)+deltaT*s(4)*sin(s(3));s(3)+u(1)*deltaT*sin(u(2))];
% state(s): s(1) is x-axis location, s(2) is y-axis location, s(3) is orientation, u(1) is speed and u(2) is angular velocity 

%measurement equations
h=@(s,l)[sqrt((l(1)-s(1))^2-(s(2)-l(2))^2); atan((l(2)-s(2))/(l(1)-s(1)))-s(3)];
% landmark(l): l(1) is x-axis location, l(2) is y-axis location

% initial actual state 
a = zeros(n,1);
%load landmark
a(4:2:n-1) = Landmark_Groundtruth(:,2);
a(5:2:n) = Landmark_Groundtruth(:,3);
 
s=a;               % initial state

P=eye(n);                          % initial state covraiance
N = size(Robot1_Groundtruth,1);                                     % total dynamic steps

sV = zeros(3,N);        %estmate        
aV = zeros(3,N);        %actual
zV = zeros(2,N);        %measurement 


z = zeros(1,2);  %landmark location(x,y)
 

flag = 1; %% flag for searching inside Odometry later 
for k = 1:N     
% num of iterations 
    t = Robot1_Groundtruth(1,1); 
    
    % collect groundtruth/actual state
    a = Robot1_Groundtruth(k,2:4);    
    aV(:,k) = a;                           % save actual state
    
    
    
    
    % collect measurment data 
   
    loc = ind(Robot1_Measurement(flag:end,1)<t+0.1 & Robot1_Measurement(flag:end,1)<t)
   
    
    zV(:,k) = z;                         % save measurement data 
    
    % ekf for ith robot 
    %EKF time update
    [s,A]=jaccsd(f,s);      %nonlinear update and linearization at current state
    P=A*P*A'+Q;             %partial update
    
    
    
    
    
    %EKF measurement update when there is a valid measurement
     if(not(isempty(loc)))
      for j = 1: size(loc)
        loc1 = find(Barcodes(6:end,2) == Robot1_Measurement(2,loc(j))); %%find the landmark number for an actual landmark
         if(not(isempty(loc1)))
                     
            
            
            [z1,H]=jaccsd(h,s);     %nonlinear measurement and linearization
            K=P*H'*inv(H*P*H'+R);   %Kalman filter gain
            s=s+K*(z-z1);           %state estimate
            P=P-K*H*P;              %state covariance matrix        
         end
      end
    end
    
    
    sV(:,k) = s;  % store estimate state
    
end 

figure
  plot(aV(1,:),aV(2,:), 'g')
  hold;
  plot(sV(1,:),sV(2,:), 'b')
  axis equal
  hold off;
  
%}
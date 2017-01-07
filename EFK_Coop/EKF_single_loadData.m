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

deltaT = 1; 
f=@(s,u)[s(1)+deltaT*s(4)*cos(s(3));s(2)+deltaT*s(4)*sin(s(3));s(3)+deltaT*s(5);u(1),u(2)];
% nonlinear state equations

h=@(s)[s(1)+sin(h(4)-s(3))*h(3), s(2)+cos(h(4)-s(3))*h(3),h(3),h(4)];
%measurement equations

% initial actual state 
a= zeros(n,1);
%load landmark
 
s=a+q*normrnd(0,0.5,[5,1]);               % initial state with noise


P=eye(n);                         

N=1000;                                     % total dynamic steps
sV = zeros(n,N);        %estmate        
aV = zeros(n,N);          %actual
zV = zeros(4,N);


z = zeros(1,4);  %landmark location(x,y), distance and angle from the robot to the landmark
t = 1248272263;  
for k = 1:N     
% num of iterations 

    % collect groundtruth/actual state
    loc = find(Robot1_Groundtruth(:,1) < t+k & Robot1_Groundtruth(:,1) > t+k-1);
    a(1:3) = Robot1_Groundtruth(loc(5),2:4); 
    loc = find(Robot1_Odometry(:,1) < t+k & Robot1_Odometry(:,1) > t+k-1)
    if(not(isempty(loc)))
      a(4:5) = Robot1_Odometry(loc(5),2:3); 
      
      s(4:5) = Robot1_Odometry(loc(5),2:3); 
 
    end
    aV(:,k) = a;                           % save actual state
    
    
    % collect measurment data 
    loc = find(Robot1_Measurement(:,1) < t+k & Robot1_Measurement(:,1) > t+k-1);
    if(not(isempty(loc)))
      for j = 1: size(loc)
        loc1 = find(Barcodes(6:end,2) == Robot1_Measurement(2,loc(j))); %%find the landmark number 
         if(not(isempty(loc1)))
           z(1:2) = Landmark_Groundtruth(loc1(1)-5,2:3);         
           z(3:4) = Robot1_Measurement(loc(1),3:4);
         end
      end
    end
    
    zV(:,k) = z;                         % save measurement data 
    
    % ekf for ith robot 
    [s,A]=jaccsd(f,s);      %nonlinear update and linearization at current state
    P=A*P*A'+Q;             %partial update
    [z1,H]=jaccsd(h,s);     %nonlinear measurement and linearization
    K=P*H'*inv(H*P*H'+R);   %Kalman filter gain
    s=s+K*(z-z1);           %state estimate
    P=P-K*H*P;              %state covariance matrix
    
    sV(:,k) = s;  % store estimate state
    
end 

figure
  plot(aV(1,:),aV(2,:), 'g')
  hold;
  plot(sV(1,:),sV(2,:), 'b')
  axis equal
  hold off;
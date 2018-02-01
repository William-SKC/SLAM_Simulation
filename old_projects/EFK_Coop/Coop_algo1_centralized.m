%%Algorithm 1 Extended Kalman filter cooperative localization (centralized)
%Basded on Cooperative Localization for Mobile Agents: A Recursive Decentralized Algorithm Base on Kalman-filter Decoupling for simulation purposes
%Shengkang Chen at UCLA 12/23/2016
clear all
load Barcodes.dat
load Robot1_Measurement.dat
load Robot1_Odometry.dat


num_robot = 5;
n=5;      %number of state for each robot: x-axis location, y-axis location, orientaion, speed and angular velocity
q=0.2;    %std of process 
r=0.2;    %std of measurement


Q=zeros(n,n,num_robot);
for j = 1:num_robot
  Q(:,:,j)=q^2*eye(n); % covariance of process
end
R=r^2;        % covariance of measurement  

deltaT = 0.5; 
f=@(s)[s(1)+deltaT*s(4)*cos(s(3));s(2)+deltaT*s(4)*sin(s(3));s(3)+deltaT*s(5);s(4);s(5)];
% nonlinear state equations

h=@(s)[s(1)+sin(h(4)-s(3))*h(3), s(2)+cos(h(4)-s(3))*h(3),h(3),h(4)];
%measurement equations

% initial actual state 
a=[0,0,0,0,0;  %x-axis location,
   0,0,0,0,0;  %y-axis location, 
   0,0,0,0,0;  %orientaion
   1,1,0.5,0.5,-1;  %speed
   0.2,-0.2,-0.2,0.2,0.1];   %angular velocity
 
s=a+q*normrnd(0,0.5,n,num_robot);                 % initial state with noise


P=zeros(n,n,num_robot); % initial state covraiance
for j1 = 1:num_robot
  P(:,:,j1)=eye(n); 
end
                              

N=60;                                     % total dynamic steps
sV = zeros(n,num_robot,N);          %estmate        
aV = zeros(n,num_robot,N);          %actual
zV = zeros(3,num_robot,N);


z = zeros(3,num_robot);
for k = 1:N     
% num of iterations 
  for i = 1:num_robot   % for ith robot
    z_i = z(:,i);
    a_i = a(:,i);
    s_i = s(:,i);
    z_i = h(a_i) + r*normrnd(0,0.2,3,1);                     % measurments
    aV(:,i,k) = a_i;                           % save actual state
    zV(:,i,k) = z_i;                           % save measurment
    
    % ekf for ith robot  
    
    P_i = P(:,:,i);
    
    [s_i,A_i]=jaccsd(f,s_i);      %nonlinear update and linearization at current state
    P_i=A_i*P_i*A_i'+Q(:,:,i);             %partial update
    [z1_i,H_i]=jaccsd(h,s_i);     %nonlinear measurement and linearization
    K_i=P_i*H_i'*inv(H_i*P_i*H_i'+R);   %Kalman filter gain
    s_i=s_i+K_i*(z_i-z1_i);           %state estimate
    P_i=P_i-K_i*H_i*P_i;              %state covariance matrix
    
    sV(:,i,k) = s_i;
    a_i = f(a_i);
    
    
    a(:,i) = a_i;     %store back actual, measuremnt and estimate state
    z(:,i) = z_i;
    s(:,i) = s_i;
  end
  
  
  
  
end 

figure
for l =1:5
  subplot(2,3,l);
  plot(aV(1,l,:),aV(2,l,:), 'g')
  hold;
  plot(sV(1,l,:),sV(2,l,:), 'b')
  axis equal
end  

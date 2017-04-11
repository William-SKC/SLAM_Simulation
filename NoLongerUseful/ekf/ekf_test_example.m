close all
clear all

n=5;      %number of state:x-axis location, y-axis location, orientation, speed and angular speed
q=0.2;    %std of process 
r=0.2;    %std of measurement
Q=q^2*eye(n); % covariance of process
R=r^2;        % covariance of measurement  

deltaT = 0.5; % for 100hz
f=@(x)[x(1)+deltaT*x(4)*cos(x(3));x(2)+deltaT*x(4)*sin(x(3));x(3)+deltaT*x(5);x(4);x(5)];
% nonlinear state equations
h=@(x)[x(1)+deltaT*x(4)*cos(x(3));x(2)+deltaT*x(4)*sin(x(3));x(3)+deltaT*x(5)];
s=[0;0;0;1;0.2];                                % initial state
x=s+q*normrnd(0,0.5,5,1); %initial state          % initial state with noise
P = eye(n);                               % initial state covraiance
N=80;                                     % total dynamic steps
xV = zeros(n,N);          %estmate        % allocate memory
sV = zeros(n,N);          %actual
zV = zeros(3,N);
for k=1:N
  z = h(s) + r*normrnd(0,0.2,3,1);                     % measurments
  sV(:,k)= s;                             % save actual state
  zV(:,k)  = z;                           % save measurment
  [x, P] = ekf_chen(f,x,P,h,z,Q,R);            % ekf 
  xV(:,k) = x;                            % save estimate
  %s = f(s) + q*normrnd(0,0.1,5,1);                % update process 
  s = f(s);
end

figure
plot(sV(1,:),sV(2,:), 'g')
hold;
plot(xV(1,:),xV(2,:), 'b')

axis equal
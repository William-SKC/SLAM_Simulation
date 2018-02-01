function [s,P]=ekf_chen(f,s,P,h,z,Q,R)
% EKF   Extended Kalman Filter for nonlinear dynamic systems
% [s, P] = ekf_chen(f,s,P,h,z,Q,R) returns state estimate, x and state covariance, P 
% for nonlinear dynamic system:
%           s_k+1 = f(s_k) + w_k
%           z_k   = h(s_k) + v_k
% where w ~ N(0,Q) meaning w is gaussian noise with covariance Q
%       v ~ N(0,R) meaning v is gaussian noise with covariance R
% Inputs:   f: function handle for f(x)
%           s: "a priori" state estimate
%           P: "a priori" estimated state covariance
%           h: fanction handle for h(x)
%           z: current measurement
%           Q: process noise covariance 
%           R: measurement noise covariance
% Output:   s: "a posteriori" state estimate
%           P: "a posteriori" state covariance
%
%Based on Yi Cao's EFK at Cranfield University, 02/01/2008

[s,A]=jaccsd(f,s);      %nonlinear update and linearization at current state
P=A*P*A'+Q;             %partial update
[z1,H]=jaccsd(h,s);     %nonlinear measurement and linearization
K=P*H'*inv(H*P*H'+R);   %Kalman filter gain
s=s+K*(z-z1);           %state estimate
P=P-K*H*P;              %state covariance matrix

function [z,A]=jaccsd(fun,x)
% JACCSD Jacobian through complex step differentiation
% [z J] = jaccsd(f,x)
% z = f(x)
% J = f'(x)
%
z=fun(x);
n=numel(x);
m=numel(z);
A=zeros(m,n);
h=n*eps;
for k=1:n
    x1=x;
    x1(k)=x1(k)+h*i;
    A(:,k)=imag(fun(x1))/h;
end
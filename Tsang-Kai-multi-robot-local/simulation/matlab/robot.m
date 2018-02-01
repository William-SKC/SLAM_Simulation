





s_0 = [13 10 -7 -10 20 40]';
s_1 = [13 10 -7 -10 20 40]';
s_2 = [13 10 -7 -10 20 40]';

position_0 = [13; 10];
position_1 = [-7; -10];
position_2 = [40; 20];

sigma_0 = zeros(6,6);
sigma_1 = zeros(6,6);
sigma_2 = zeros(6,6);

u_0 = [1,0];
u_1 = [-2, 0];

dt = 1;


var_u_v = 0.01;
var_u_theta = 0.01;

var_v = 10;

theta_0 = 4;
theta_1 = 4;

for t = 1:10
    %% robot 0 propagation update
    v = u_0(1);
    a_v = u_0(2);
    
    s_0(1) =  s_0(1) + cos(theta_0)*v*dt;
    s_0(2) =  s_0(2) + sin(theta_0)*v*dt;
    
    for i = 1:3
        ii = 2*i-1;
        if i == 1
            sigma_0(ii:ii+1,ii:ii+1) = sigma_0(ii:ii+1,ii:ii+1) + (dt*dt).* rot_mat(theta_0) ...
                * [var_u_v, 0; 0, var_u_theta] * rot_mat(theta_0)';
            
        else
            sigma_0(ii:ii+1,ii:ii+1) = sigma_0(ii:ii+1,ii:ii+1) + (dt*dt*var_v).*eye(2);            
        end
        
    end
    
    v = v + var_u_v*randn();
    
    position_0(1) = position_0(1) + cos(theta_0)*v*dt;
    position_0(2) = position_0(2) + cos(theta_0)*v*dt;
    
    theta_0 = theta_0 + sqrt(var_u_theta)*randn();

    
    
    
    %% robot 1 propagation update
    v = u_1(1);
    a_v = u_1(2);
    
    s_1(3) =  s_1(3) + cos(theta_1)*v*dt;
    s_1(4) =  s_1(4) + sin(theta_1)*v*dt;
    
    for i = 1:3
        ii = 2*i-1;
        if i == 2
            sigma_1(ii:ii+1,ii:ii+1) = sigma_1(ii:ii+1,ii:ii+1) + (dt*dt).* rot_mat(theta_1) ...
                * [var_u_v, 0; 0, var_u_theta] * rot_mat(theta_0)';
            
        else
            sigma_1(ii:ii+1,ii:ii+1) = sigma_1(ii:ii+1,ii:ii+1) + (dt*dt*var_v).*eye(2);            
        end
        
    end
    
    v = v + var_u_v*randn();
    
    position_1(1) = position_1(1) + cos(theta_1)*v*dt;
    position_1(2) = position_1(2) + cos(theta_1)*v*dt;
    
    theta_1 = theta_1 + sqrt(var_u_theta)*randn();
    

end


%%% relative observation without comm.

s_0
sigma_0
position_1


obs = position_1 - position_0;
dis = norm(obs);
phi = atan2(obs(2),obs(1))-theta_0;


z = [dis*cos(phi); dis*sin(phi)];
%hat_z = rot_mat(theta_0)' * [s_0(3)-s_0(1); s_0(4)-s_0(2)]

H = [(-1).*eye(2), eye(2), zeros(2,2)];
J = [0 -1;1 0];
hat_z = H * s_0
sigma_invention = H * sigma_0 * H' + 0.001 * eye(2) + (0.001-0.001/(dis*dis)).*J*z*z'*J';
kalman = sigma_0 * H' * inv(sigma_invention)
s_0 = s_0 + kalman*(z - hat_z)


sigma_0 = sigma_0 - kalman*H*sigma_0










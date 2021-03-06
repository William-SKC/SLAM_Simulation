from numpy import matrix
from numpy import random
from math import cos, sin, atan2, sqrt


N = 5

J = matrix([[0, -1],[1, 0]])

z_mtx_10 = matrix([[0,0,0,0,0,0,0,0,0,0], 
	[0,0,0,0,0,0,0,0,0,0], 
	[0,0,0,0,0,0,0,0,0,0], 
	[0,0,0,0,0,0,0,0,0,0], 
	[0,0,0,0,0,0,0,0,0,0], 
	[0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0],
	[0,0,0,0,0,0,0,0,0,0]], dtype=float)


i_mtx_2 = matrix([[1, 0],[0, 1]], dtype=float)

dt = 1.0


max_v = 2
max_oemga = 0.05


var_u_v = 0.01
var_u_theta = 0.01

var_v = 100.0

var_dis = 0.001
var_phi = 0.001


########################################################


origin = [0.0, 0.0]

def inRange(a, b):
	if sqrt(pow(a[0]-b[0], 2)+pow(a[1]-b[1], 2)) > 50:
		return False
	else:
		return True



########################################################


class Landmark:

	def __init__(self, index, position):
		self.index = index
		self.position = position



class Robot:


	def __init__(self, index , initial_s):
		self.index = index

		self.s = initial_s
		self.sigma = z_mtx_10.copy()

		self.position = [initial_s[2*index,0], initial_s[2*index+1,0]]
		self.theta = 4









	def prop_update(self):


		# select valid motion input
		[v, a_v] = [random.uniform(-max_v,max_v), random.uniform(-max_oemga,max_oemga)]
		v_star = v + random.normal(0, sqrt(var_u_v))
		pre_update_position = [self.position[0] + cos(self.theta)*v_star*dt, self.position[1] + sin(self.theta)*v_star*dt]


		while(not inRange(pre_update_position, origin)):

			[v, a_v] = [random.uniform(-max_v,max_v), random.uniform(-max_oemga,max_oemga)]
			v_star = v + random.normal(0, sqrt(var_u_v))
			pre_update_position = [self.position[0] + cos(self.theta)*v_star*dt, self.position[1] + sin(self.theta)*v_star*dt]


		# real position update
		self.position[0] = self.position[0] + cos(self.theta)*v_star*dt
		self.position[1] = self.position[1] + sin(self.theta)*v_star*dt

		self.theta = self.theta + a_v*dt


		i = 2*self.index

		# estimation update
		self.s[i,0] = self.s[i,0] + cos(self.theta)*v*dt
		self.s[i+1,0] = self.s[i+1,0] + sin(self.theta)*v*dt

		# covariance update
		for j in range(N):
			inx = 2*j

			if j==self.index:
				self.sigma[inx:inx+2, inx:inx+2] = self.sigma[inx:inx+2, inx:inx+2]+ dt*dt*rot_mtx(self.theta)*matrix([[var_u_v, 0],[0, v*v*var_u_theta]])*rot_mtx(self.theta).T

			else:
				self.sigma[inx:inx+2, inx:inx+2] = self.sigma[inx:inx+2, inx:inx+2] + dt*dt*var_v*i_mtx_2.copy()










	def ablt_obsv(self, obs_value, landmark):
		i = 2*self.index


		H_i = matrix([[0,0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0,0]], dtype=float)
		H_i[0, i] = -1
		H_i[1, i+1] = -1


		H = rot_mtx(self.theta).getT()*H_i
		
		dis = obs_value[0]
		phi = obs_value[1]

		#z = [dis*cos(phi), dis*sin(phi)]
		hat_z = rot_mtx(self.theta).getT() * (landmark.position + H_i*self.s)
		z = matrix([dis*cos(phi), dis*sin(phi)]).getT()

		sigma_z = rot_mtx(phi) * matrix([[var_dis, 0],[0, dis*dis*var_phi]]) * rot_mtx(phi).getT() 
		sigma_invention = H * self.sigma * H.getT()  + sigma_z
		kalman_gain = self.sigma*H.getT()*sigma_invention.getI()


		self.s = self.s + kalman_gain*(z - hat_z)

		self.sigma = self.sigma - kalman_gain*H*self.sigma


	def rela_obsv(self, obs_idx, obs_value):

		i = 2*self.index
		j = 2*obs_idx


		H_ij = matrix([[0,0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0,0]], dtype=float)
		H_ij[0, i] = -1
		H_ij[1, i+1] = -1
		H_ij[0, j] = 1
		H_ij[1, j+1] = 1


		H = rot_mtx(self.theta).getT()*H_ij

		dis = obs_value[0]
		phi = obs_value[1]

		#z = [dis*cos(phi), dis*sin(phi)]
		hat_z = H * self.s
		z = matrix([dis*cos(phi), dis*sin(phi)]).getT()
		print 'z'
		print hat_z
		print z 
		sigma_z = rot_mtx(phi) * matrix([[var_dis, 0],[0, dis*dis*var_phi]]) * rot_mtx(phi).getT() 
		sigma_invention = H * self.sigma * H.getT()  + sigma_z
		kalman_gain = self.sigma*H.getT()*sigma_invention.getI()


		self.s = self.s + kalman_gain*(z - hat_z)

		self.sigma = self.sigma - kalman_gain*H*self.sigma




	def comm(self, comm_robot_s, comm_robot_sigma):
		#i = 2*self.index
		#j = 2*comm_idx


		#i = 2*self.index
		#j = 2*comm_idx
		#sigma_invention = self.sigma + comm_robot_sigma
		#kalman_gain = self.sigma * sigma_invention.getI()
		#self.s = self.s + kalman_gain*(comm_robot_s - self.s)
		#self.sigma = self.sigma - kalman_gain*self.sigma

		e = 0.3


		#self.sigma 

		sig_inv = e*self.sigma.getI() + (1-e)*comm_robot_sigma.getI()
		self.sigma = sig_inv.getI()

		self.s = self.sigma * (e*self.sigma.getI()*self.s + (1-e)*comm_robot_sigma.getI()*comm_robot_s)


	def status(self):

		position_str = '[' + str(round(self.position[0],3)) + ', ' + str(round(self.position[1],3)) + ']'

		estimation_str = '['
		for i in range(2*N):
			if 0 < i <2*N:
				estimation_str += ', '
			estimation_str += str(round(self.s[i],3))
		estimation_str += ']'

		covariance_str = '['
		for i in range(2*N):
			if 0 < i <2*N:
				covariance_str += '\n'				

			for j in range(2*N):
				if 0 < j <2*N:
					covariance_str += ', '		
				covariance_str += str(round(self.sigma[i,j],3))
		covariance_str += ']'



		print('\n')
		print('robot ' + str(self.index))
		print('\tcurrent position: ' + position_str)
		print('\testimation: ' + estimation_str)
		print('\tcovariance: \n' + covariance_str)


def rot_mtx(theta):
	return matrix([[cos(theta), -sin(theta)], [sin(theta), cos(theta)]])



def relative_measurement(robot_1, robot_2):

	delta_x = robot_2.position[0] - robot_1.position[0]
	delta_y = robot_2.position[1] - robot_1.position[1]
	dis = sqrt(delta_y*delta_y + delta_x*delta_x) + random.normal(0, sqrt(var_dis))
	phi = atan2(delta_y, delta_x) + random.normal(0, sqrt(var_phi)) - robot_1.theta

	return [dis, phi]


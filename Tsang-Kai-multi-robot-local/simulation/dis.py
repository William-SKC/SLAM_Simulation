from numpy import matrix

import robot


N = 3 # number of robot
M = 1 # number of landmark


initial = matrix([13, 10, -7, -10, 20, 40], dtype=float).T



robots = [None] * N
for n in range(N):
	robots[n] = robot.Robot(n, initial.copy())


landmarks = [None] * M
for m in range(M):
	landmarks[m] = robot.Landmark(m, matrix([0.01, 0.02], dtype=float).getT())

###

robot_0_input = [1, 0.02]
robot_1_input = [-2, 0.02]
robot_2_input = [1.5, 0.02]


dt = 1







print('\n\n\n\n\n\n\n\n\n')

for t in range(100):

	robots[0].prop_update(robot_0_input)
	robots[1].prop_update(robot_1_input)
	robots[2].prop_update(robot_2_input)

print('After 100 runs motion propagation...')
raw_input()



for i in range(3):
	print('The actual position of robot ' + str(i) + ' ...')
	print(robots[i].position)
	raw_input()

	print('The estimate of robot ' + str(i) + ' ...')
	print(robots[i].s)
	raw_input()	

	print('The covariance of robot ' + str(i) + ' ...')
	print(robots[i].sigma)
	raw_input()	

	print('\n\n\n')



#############

[dis, phi] = robot.relative_measurement(robots[0], robots[1])
robots[0].rela_obsv(1, [dis, phi])

i = 0

print(' Robot 0 observes robot 1 ...')
print('The estimate of robot ' + str(i) + ' ...')
print(robots[i].s)
raw_input()	

print('The covariance of robot ' + str(i) + ' ...')
print(robots[i].sigma)
raw_input()	


print('\n\n\n')



#############

robots[2].comm(0, robots[0].s, robots[0].sigma)

i = 2

print('Robot 2 receives the information from robot 0 ...')
print('The estimate of robot ' + str(i) + ' ...')
print(robots[i].s)
raw_input()	

print('The covariance of robot ' + str(i) + ' ...')
print(robots[i].sigma)
raw_input()	



#robots[0].comm(1, robots[1].s, robots[1].sigma)


#[dis, phi] = robot.relative_measurement(robots[0], landmarks[0])
#robots[0].ablt_obsv([dis, phi], landmarks[0])




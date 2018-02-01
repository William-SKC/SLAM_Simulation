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


dt = 1




for t in range(100):

	robots[0].prop_update(robot_0_input)
	robots[1
           ].prop_update(robot_1_input)




#print("relative measurement")

print('before ......')

print(robots[0].s)
print(robots[0].sigma)

print(robots[1].position)

#robots[0].comm(1, robots[1].s, robots[1].sigma)
[dis, phi] = robot.relative_measurement(robots[0], robots[1])
robots[0].rela_obsv(1, [dis, phi])



#[dis, phi] = robot.relative_measurement(robots[0], landmarks[0])
#robots[0].ablt_obsv([dis, phi], landmarks[0])



print('\nafter ......')

print(robots[0].s)
print(robots[0].sigma)


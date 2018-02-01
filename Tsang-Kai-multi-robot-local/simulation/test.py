from numpy import matrix

import robot


N = 5 # number of robot
M = 1 # number of landmark




initial = matrix([1, 1, 1, 2, 2, 1, -1, -1, 1, 3], dtype=float).T



robots = [None] * N
for n in range(N):
	robots[n] = robot.Robot(n, initial.copy())


landmarks = [None] * M
for m in range(M):
	landmarks[m] = robot.Landmark(m, matrix([0.01, 0.02], dtype=float).getT())

###



dt = 1



for i in range(10):

	# motion propagation
	robots[0].prop_update()
	robots[1].prop_update()
	robots[2].prop_update()
	robots[3].prop_update()
	robots[4].prop_update()

	# communication
	robots[0].comm(robots[4].s, robots[4].sigma)


	# observation - robot 0
	[dis, phi] = robot.relative_measurement(robots[0], robots[1])
	robots[0].rela_obsv(1, [dis, phi])

	[dis, phi] = robot.relative_measurement(robots[0], robots[2])
	robots[0].rela_obsv(2, [dis, phi])

	[dis, phi] = robot.relative_measurement(robots[0], robots[3])
	robots[0].rela_obsv(3, [dis, phi])


	# observation - robot 4
	[dis, phi] = robot.relative_measurement(robots[4], landmarks[0])
	robots[4].ablt_obsv([dis, phi], landmarks[0])

	[dis, phi] = robot.relative_measurement(robots[4], robots[3])
	robots[4].rela_obsv(3, [dis, phi])




	print('\n\nt = ' + str(i) + '    ===================================\n\n\n')
	robots[0].status()
	#robots[1].status()
	#robots[2].status()
	#robots[3].status()
	robots[4].status()







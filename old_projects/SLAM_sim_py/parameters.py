#### parameters for localization

import numpy as np

sigma_o = np.matrix(' 0.01 0; 0 0.1')   #R-measurement noise 
sigma_odo = np.matrix('0.001 0; 0 0.001') #Q-process noise

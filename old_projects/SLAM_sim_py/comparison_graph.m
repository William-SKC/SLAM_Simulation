clear all
close all
Est = importdata('Results.txt','\t');
Ground = importdata('gt.txt','\t');

i = 1;
for i = 1: 988
    if Est(i,2) > 3.6
        t_err = Est(i,1)
        break;
    end
end
figure
plot(Est(:,2),Est(:,3), 'r*')
  hold;
  plot(Ground(:,2),Ground(:,3), 'bs')
  hold off;
  title('single robot EKF -- w/ measurement')
  xlabel('x') % x-axis label
  ylabel('y') % y-axis label
  legend('estimate','groudtruth','Location','northwest')
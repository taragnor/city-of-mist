# --cwebp_compressor.py--

# cmd> python cwebp_compressor.py "F:\Programme\Foundry Repos\city-of-mist\images" 85

import sys
from subprocess import call
from glob import glob

#folder-name
path = sys.argv[1]
#quality of produced .webp images [0-100]
quality = sys.argv[2]

if int(quality) < 0 or int(quality) > 100:
	print("image quality out of range[0-100] ;/:/")
	sys.exit(0)

img_list = []
for img_name in glob(path+'/*'):
	# one can use more image types(bmp,tiff,gif)
	if img_name.endswith(".jpg") or img_name.endswith(".png") or img_name.endswith(".jpeg"):
		# extract images name(image_name.[jpg|png]) from the full path
		img_list.append(img_name.split('\\')[-1])


# print(img_list)	# for debug
for img_name in img_list:
	# though the chances are very less but be very careful when modifying the below code
	cmd='cwebp \"'+path+'/'+img_name+'\" -q '+quality+' -o \"'+path+'/'+(img_name.split('.')[0])+'.webp\"'
	# running the above command
	call(cmd, shell=False)	
	# print(cmd)	# for debug
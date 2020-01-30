#!/usr/bin/env bash

set -ex

echo "downloading artifact and artifact-info.txt in filesystem from s3 bucket"

aws s3 cp s3://binary-frontend-backup/webtrader/latest/artifact.tar /tmp/
aws s3 cp s3://binary-frontend-backup/webtrader/latest/artifact-info.txt /tmp/

echo "calculating checksum of artifact"

new_chksum=$(sha256sum /tmp/artifact.tar | cut -d ' ' -f 1)
orig_chksum=$(cat /tmp/artifact-info.txt)
app_dir=/home/chaks/www/app

if [ "${new_chksum}" == "${orig_chksum}" ]
then
	echo "checksum matched!! now extracting static contents in specific directory"
	tar -xvf artifact.tar --directory ${app_dir}/
else
	echo "checksim did not match"
	exit 1
fi

echo "removing artifacts and artifacts information from filesystem"
rm -f /tmp/artifact*.{tar,txt}

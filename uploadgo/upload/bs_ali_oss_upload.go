package upload

import (
	log "github.com/sirupsen/logrus"
	"uploadgo/config"
)
import "github.com/aliyun/aliyun-oss-go-sdk/oss"

type BsAliYunOssUpload struct {
	Endpoint        string
	AccessKeyId     string
	AccessKeySecret string
	BucketName      string
	OnUploading     func(filename string)
	OnUploadFail    func(filename string)
	client          *oss.Client
	bucket          *oss.Bucket
}

func CreateBsAliYunOssUpload(c *config.Config) (*BsAliYunOssUpload, error) {
	a := &BsAliYunOssUpload{}
	a.Endpoint = c.GetStringDefault("aliyun.oss.endpoint", "oss-cn-shenzhen.aliyuncs.com")
	a.AccessKeyId = c.GetStringDefault("aliyun.oss.accessKeyId", "LTAI4Frt2rLRThgejNSZRdfv")
	a.AccessKeySecret = c.GetStringDefault("aliyun.oss.accessKeySecret", "HdrhJXg1CHuWJ9RqwbrNnw9iOtl0Dz")
	a.BucketName = c.GetStringDefault("aliyun.oss.bs.bucketName", "lenker-business-oss")
	client, err := oss.New(a.Endpoint, a.AccessKeyId, a.AccessKeySecret)
	if err != nil {
		return nil, err
	}
	a.client = client
	bucket, err := a.client.Bucket(a.BucketName)
	if err != nil {
		return nil, err
	}
	a.bucket = bucket
	return a, nil
}

func (a *BsAliYunOssUpload) Upload(localFile, remoteName string) error {
	a.Uploading(localFile)

	err := a.bucket.PutObjectFromFile(remoteName, localFile)
	log.Infof("阿里云文件上传，本地：%s ,远程：%s", localFile, remoteName)
	return err
}

func (a *BsAliYunOssUpload) UploadFail(filename string) {
	if a.OnUploadFail != nil {
		a.OnUploadFail(filename)
	}
}

func (a *BsAliYunOssUpload) Uploading(filename string) {
	if a.OnUploading != nil {
		a.OnUploading(filename)
	}
}

func (a *BsAliYunOssUpload) List() {

	marker := ""
	for {
		lsRes, err := a.bucket.ListObjects(oss.Marker(marker))
		if err != nil {
			return
		}
		for _, object := range lsRes.Objects {
			log.Debug("Bucket: ", object.Key)
		}

		if lsRes.IsTruncated {
			marker = lsRes.NextMarker
		} else {
			break
		}
	}
}

package upload

import (
	log "github.com/sirupsen/logrus"
	"uploadgo/config"
)
import "github.com/aliyun/aliyun-oss-go-sdk/oss"

type AmsAliYunOssUpload struct {
	Endpoint        string
	AccessKeyId     string
	AccessKeySecret string
	BucketName      string
	OnUploading     func(filename string)
	OnUploadFail    func(filename string)
	client          *oss.Client
	bucket          *oss.Bucket
}

func CreateAmsAliYunOssUpload(c *config.Config) (*AmsAliYunOssUpload, error) {
	a := &AmsAliYunOssUpload{}
	a.Endpoint = c.GetStringDefault("aliyun.oss.endpoint", "oss-cn-shenzhen.aliyuncs.com")
	a.AccessKeyId = c.GetStringDefault("aliyun.oss.accessKeyId", "LTAI4Frt2rLRThgejNSZRdfv")
	a.AccessKeySecret = c.GetStringDefault("aliyun.oss.accessKeySecret", "HdrhJXg1CHuWJ9RqwbrNnw9iOtl0Dz")
	a.BucketName = c.GetStringDefault("aliyun.oss.ams.bucketName", "lenkor-ams-oss")
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

func (a *AmsAliYunOssUpload) Upload(localFile, remoteName string) error {
	a.Uploading(localFile)
	err := a.bucket.PutObjectFromFile(remoteName, localFile)
	log.Infof("阿里云文件上传，本地：%s ,远程：%s", localFile, remoteName)
	return err
}

func (a *AmsAliYunOssUpload) UploadFail(filename string) {
	if a.OnUploadFail != nil {
		a.OnUploadFail(filename)
	}
}

func (a *AmsAliYunOssUpload) Uploading(filename string) {
	if a.OnUploading != nil {
		a.OnUploading(filename)
	}
}

func (a *AmsAliYunOssUpload) List() {

	marker := ""
	for {
		lsRes, err := a.bucket.ListObjects(oss.Marker(marker))
		if err != nil {
			return
		}

		// 打印列举文件，默认情况下一次返回100条记录。
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

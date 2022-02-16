package upload

type FileUploader interface {
	Upload(localhostFilePath, remoteFileName string) error
	Uploading(filename string)
	UploadFail(filename string)
}

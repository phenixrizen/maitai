package main

import (
	"github.com/davecgh/go-spew/spew"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
)

func main() {
	r := gin.Default()

	// static content
	r.Use(static.Serve("/", static.LocalFile("./static", false)))

	// maitai endpoint
	r.POST("/maitai", func(c *gin.Context) {
		var maitai map[string]interface{}
		c.MustBindWith(&maitai, binding.JSON)
		spew.Dump(maitai)
		c.JSON(200, maitai)
	})

	r.Run()
}

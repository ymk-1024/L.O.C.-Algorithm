variable "deploy_host" {
  type        = string
  description = "The IP address of the deploy host hosting the ZIP artifact"
}

variable "mysql_host" {
  type        = string
  default     = "127.0.0.1"
  description = "MySQL database host address"
}

variable "mysql_port" {
  type        = string
  default     = "3306"
  description = "MySQL database port"
}

variable "mysql_user" {
  type        = string
  default     = "admin"
  description = "MySQL database user"
}

variable "mysql_password" {
  type        = string
  default     = "114514"
  description = "MySQL database password"
}

variable "mysql_database" {
  type        = string
  default     = "LOCDB"
  description = "MySQL database name"
}

job "loc-api" {
  datacenters = ["dc1"]
  type        = "service"

  group "api" {
    count = 1

    network {
      port "http" {
        static = 3005
      }
    }

    task "app" {
      driver = "raw_exec"

      artifact {
        source      = "http://${var.deploy_host}:8080/loc-api.zip"
        destination = "local/app"
      }

      config {
        command = "/home/mattya3340/.nvm/versions/node/v24.16.0/bin/node"
        args    = [
          "local/app/app.mjs"
        ]
      }

      env {
        PORT           = "3005"
        MYSQL_HOST     = "${var.mysql_host}"
        MYSQL_PORT     = "${var.mysql_port}"
        MYSQL_USER     = "${var.mysql_user}"
        MYSQL_PASSWORD = "${var.mysql_password}"
        MYSQL_DATABASE = "${var.mysql_database}"
      }

      resources {
        cpu    = 300
        memory = 512
      }
    }
  }
}

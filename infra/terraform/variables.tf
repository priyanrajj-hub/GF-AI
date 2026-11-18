variable "environment" {
  description = "Target deployment environment (development, staging, production)"
  type        = string
  default     = "production"
}

variable "region" {
  description = "Primary cloud provider deployment region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "VPC network CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "database_instance_class" {
  description = "Database instance hardware sizing"
  type        = string
  default     = "db.t4g.medium"
}

variable "kubernetes_node_count" {
  description = "Number of worker nodes in the Kubernetes node group"
  type        = number
  default     = 3
}

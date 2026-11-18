output "vpc_id" {
  description = "The ID of the provisioned VPC"
  value       = module.network.vpc_id
}

output "kubernetes_cluster_name" {
  description = "EKS Cluster Name"
  value       = module.compute.cluster_name
}

output "database_endpoint" {
  description = "PostgreSQL RDS connection endpoint"
  value       = module.database.endpoint
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = module.redis.endpoint
}

output "asset_bucket" {
  description = "S3 Object storage bucket name"
  value       = module.storage.bucket_name
}

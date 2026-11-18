# Managed ElastiCache Redis Cluster

resource "aws_elasticache_subnet_group" "redis_subnet" {
  name       = "gf-ai-${var.environment}-redis-subnets"
  subnet_ids = var.subnet_ids
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "gf-ai-${var.environment}-redis"
  engine               = "redis"
  node_type            = "cache.t4g.small"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.redis_subnet.name

  tags = {
    Environment = var.environment
  }
}

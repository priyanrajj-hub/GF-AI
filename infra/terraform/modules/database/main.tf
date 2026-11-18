# Managed PostgreSQL RDS Instance

resource "aws_db_subnet_group" "db_subnet" {
  name       = "gf-ai-${var.environment}-db-subnet-group"
  subnet_ids = var.subnet_ids

  tags = {
    Name = "gf-ai-${var.environment}-db-subnet-group"
  }
}

resource "random_password" "db_password" {
  length  = 32
  special = false
}

resource "aws_db_instance" "postgres" {
  identifier             = "gf-ai-${var.environment}-db"
  allocated_storage      = 50
  max_allocated_storage  = 200
  engine                 = "postgres"
  engine_version         = "16.2"
  instance_class         = var.instance_class
  db_name                = "gf_ai"
  username               = "gf_admin"
  password               = random_password.db_password.result
  db_subnet_group_name   = aws_db_subnet_group.db_subnet.name
  skip_final_snapshot    = true
  multi_az               = var.environment == "production"
  storage_encrypted      = true
  deletion_protection    = var.environment == "production"

  tags = {
    Environment = var.environment
  }
}

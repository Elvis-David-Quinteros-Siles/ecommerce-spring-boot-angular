# Política de solo lectura para ecommerce-spring-boot-angular
path "secret/data/ecommerce-spring-boot-angular/*" {
  capabilities = ["read"]
}

path "secret/metadata/ecommerce-spring-boot-angular/*" {
  capabilities = ["read", "list"]
}

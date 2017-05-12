
class Category
  include DataMapper::Resource

  property :id,         Serial
  property :title,      String

  has n, :books
end
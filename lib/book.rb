class Book
  include DataMapper::Resource

  property :id,         Serial
  property :title,      String
  property :author,     String
  property :close,      Integer,    :default  => 0

  has n, :catalogs
end
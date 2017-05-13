#coding: utf-8

require 'open-uri'
require 'nokogiri'

require 'data_mapper'

require 'logger'

if ARGV.first.to_s == 'exit'
  if File.exist?('dushu233.pid')
    pid = `cat dushu233.pid`
    `kill -9 #{pid} `
    File.delete('dushu233.pid')
  end
  Process.exit
end

if File.exist?('dushu233.pid')
  pid = IO.read('dushu233.pid').delete("\n")
  puts("Process #{pid} is Running! Please run: \"ruby dushu233.rb exit\"")
  Process.exit
end

pid_txt = File.open('dushu233.pid',"wb")
pid_txt.puts Process.pid
pid_txt.close

# $logger = Logger.new('dushu233.log')
$logger = Logger.new(STDOUT)
$logger.datetime_format = '%Y-%m-%d %H:%M:%S'

class Book
  include DataMapper::Resource

  property :id,         Serial
  property :title,      String
  property :author,     String
  property :description,String,     :default  => '',        :length => 500
  property :category_id,Integer,    :index => :index_books_on_category_id
  property :close,      Integer,    :default  => 0
  property :views,      Integer,    :default  => 0

  has n, :catalogs
  belongs_to :category
end

class Catalog
  include DataMapper::Resource

  property :id,         Serial
  property :book_id,    Integer,    :index => :index_books_on_catalogs_id
  property :catalog_id, Integer
  property :title,      String
  property :src,        String

  belongs_to :book
end

class Category
  include DataMapper::Resource

  property :id,         Serial
  property :title,      String

  has n, :books
end

DataMapper.setup(:default, (ENV["DATABASE_URL"] || "sqlite3:///#{File.expand_path(File.dirname(__FILE__))}/dushu233.sqlite"))
DataMapper.finalize
DataMapper.auto_upgrade!

begin

  host = 'http://www.qu.la/book'
  m_host = 'http://m.qu.la/book'

  $logger.info('Start Update......')
  error = 0
  (1..50000).each do |index|

    j = 0
    begin
      book = Book.first(:id => index)
      if !book.nil? && book.close==1
        $logger.info("close:#{index}:#{book.title}")
        next
      end

      url = "#{host}/#{index.to_s}/"
      m_url = "#{m_host}/#{index.to_s}/"
      doc = Nokogiri::HTML(open(url), nil, 'UTF-8')
      title_node = doc.css('meta[property="og:title"]')

      unless title_node.nil? || title_node.to_s==''

        title = doc.css('meta[property="og:title"]').attribute('content').to_s.encode('UTF-8')
        author = doc.css('meta[property="og:novel:author"]').attribute('content').to_s.encode('UTF-8')
        category = doc.css('meta[property="og:novel:category"]').attribute('content').to_s.encode('UTF-8')
        description = doc.css('meta[property="og:description"]').attribute('content').to_s.encode('UTF-8')
        status = doc.css('meta[property="og:novel:status"]').attribute('content').to_s.encode('UTF-8')

        cate = Category.first(:title => category)
        if cate.nil?
          cate = Category.new
          cate.title = category
          cate.save
        end
        if book.nil?
          book = Book.new
          book.id = index
        end
        book.title = title
        book.author = author
        book.description = description
        book.category_id = cate.id
        book.save

        $logger.info("downloading:#{index}:#{title}")

        nodes = doc.css('dd')
        book_id = book.id

        last_node = nodes.last
        catalog_id = last_node.css('a')[0]['href'].split('/').last.delete('^0-9').to_i
        catalog = Catalog.first(:book_id => book_id, :catalog_id=> catalog_id)
        unless catalog.nil?
          if status=='完成'
            book.close = 1
            book.save
            $logger.info("close:#{book.title}")
            next
          end
          next
        end

        nodes.each do |node|

          i = 0
          begin
            unless node.css('a')[0].nil?
              catalog_title = node.text.delete('/\:*?"<>|')
              catalog_id = node.css('a')[0]['href'].split('/').last.delete('^0-9').to_i
              catalog = Catalog.first(:book_id => book_id, :catalog_id=> catalog_id)
              if catalog.nil?
                catalog = Catalog.new
              end
              catalog.book_id = book_id
              catalog.catalog_id = catalog_id
              catalog.title = catalog_title
              catalog.src = "#{host}/#{book_id}/#{catalog_id}.html"
              catalog.save
            end
          rescue Exception => e
            i = i+1
            if i<10
              retry
            end
            $logger.error(e)
          end

        end

        if status=='完成'
          book.close = 1
          book.save
          $logger.info("close:#{book.title}")
        end
      else
        error = error+1
        if error>1000
          break
        end
      end
    rescue Exception => e
      j = j+1
      if j<10
        retry
      end
      $logger.error(e)
    end

  end
  $logger.info('Close Update.')

  if File.exist?('dushu233.pid')
    File.delete('dushu233.pid')
  end

end
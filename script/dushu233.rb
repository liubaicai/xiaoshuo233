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
  property :close,      Integer,    :default  => 0

  has n, :catalogs
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

DataMapper.setup(:default, (ENV["DATABASE_URL"] || "sqlite3:///#{File.expand_path(File.dirname(__FILE__))}/dushu233.sqlite"))
DataMapper.finalize
DataMapper.auto_upgrade!

def CheckIsClose m_url,book,logger
  begin
    mdoc = Nokogiri::HTML(open(m_url), nil, 'UTF-8')
    if mdoc.inner_html.include?('状态：完成')
      book.close = 1
      book.save
      logger.info("close:#{book.title}")
    end
  rescue Exception => e
    logger.error(e)
  end
end

begin

  host = 'http://www.qu.la/book'
  m_host = 'http://m.qu.la/book'

  $logger.info('Start Update......')
  error = 0
  (1..30000).each do |index|

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
      title = doc.css('div#info h1')
      author = doc.css('div#info p').first

      unless title.nil? || title.to_s==''
        if book.nil?
          book = Book.new
          book.id = index
        end
        book.title = title.inner_html.encode('UTF-8')
        book.author = author.inner_html.encode('UTF-8').delete('作&nbsp;&nbsp;者：').gsub(/\A\p{Space}*|\p{Space}*\z/, '')
        book.save
        nodes = doc.css('dd')
        book_id = book.id

        last_node = nodes.last
        catalog_id = last_node.css('a')[0]['href'].split('/').last.delete('^0-9').to_i
        catalog = Catalog.first(:book_id => book_id, :catalog_id=> catalog_id)
        unless catalog.nil?
          CheckIsClose(m_url,book,$logger)
          $logger.info("downloaded:#{index}:#{title.inner_html}")
          next
        end

        $logger.info("downloading:#{index}:#{title.inner_html}")

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

        CheckIsClose(m_url,book,$logger)

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
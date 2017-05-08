#coding: utf-8

require 'open-uri'
require 'nokogiri'

require  'sqlite3'
require  'active_record'

require 'logger'

ActiveRecord::Base.establish_connection(
    :adapter => 'sqlite3',
    :database => 'dushu233.sqlite')

# logger = Logger.new('dushu233.log')
logger = Logger.new(STDOUT)
logger.datetime_format = '%Y-%m-%d %H:%M:%S'

class Book < ActiveRecord::Base
  has_many :catalogs

end

class Catalog < ActiveRecord::Base
  belongs_to :book

end

def CheckIsClose m_url,book
  mdoc = Nokogiri::HTML(open(m_url), nil, "UTF-8")
  if mdoc.inner_html.include?('状态：完成')
    book.close = 1
    book.save
    logger.info("close:#{book.title}")
  end
end

if ARGV.to_s.include?'exit'
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

begin

  host = 'http://www.qu.la/book'
  m_host = 'http://m.qu.la/book'

  logger.info('Start Update......')
  error = 0
  (1..100).each do |index|
    begin
      book = Book.where(:id => index).first
      if !book.nil? && book.close==1
        next
      end

      url = "#{host}/#{index.to_s}/"
      m_url = "#{m_host}/#{index.to_s}/"
      doc = Nokogiri::HTML(open(url), nil, "UTF-8")
      title = doc.css('div#info h1')

      unless title.nil? || title.to_s==''
        if book.nil?
          book = Book.new
          book.id = index
        end
        book.title = title.inner_html.encode('UTF-8')
        book.save
        nodes = doc.css('dd')
        book_id = book.id

        last_node = nodes.last
        catalog_id = last_node.css('a')[0]['href'].split('/').last.delete('^0-9')
        catalog = Catalog.where(:book_id => book_id, :catalog_id=> catalog_id).take
        unless catalog.nil?
          CheckIsClose(m_url,book)
          next
        end

        logger.info("downloading:#{index}:#{title.inner_html}")

        nodes.each do |node|
          i = 0
          begin
            unless node.css('a')[0].nil?
              catalog_title = node.text.delete('/\:*?"<>|')
              catalog_id = node.css('a')[0]['href'].split('/').last.delete('^0-9')
              catalog = Catalog.where(:book_id => book_id, :catalog_id=> catalog_id).take
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
            if i<100
              retry
            end
            logger.error(e)
          end
        end

        CheckIsClose(m_url,book)
      else
        if error>=100
          break
        end
        error = error + 1
      end
    rescue Exception => e
      error = error+1
      if error<100
        retry
      end
      logger.error(e)
    end
  end
  logger.info('Close Update.')
end

# 下载内容code
# puts "#{catalog_id}:#{catalog_title}"
# doc = Nokogiri::HTML(open("#{host}/#{book_id}/#{catalog_id}.html"), nil, "UTF-8")
# n = doc.css('div#content')[0]
# n.search('script').remove
# content = n.inner_html
# content.gsub!('<br>　　<br>', '<br>')
# puts content
# break
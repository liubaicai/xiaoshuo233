#coding: utf-8

scheduler = Rufus::Scheduler.new
scheduler.cron '0 * * * * 1' do

  begin

    host = 'http://www.qu.la/book'
    logger = Logger.new(STDOUT)

    logger.info('Start Update......')
    error = 0
    (1..50000).each do |index|

      j = 0
      begin
        book = Book.first(:id => index)
        if !book.nil? && book.close==1
          next
        end

        url = "#{host}/#{index.to_s}/"
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

          nodes = doc.css('dd')
          book_id = book.id

          last_node = nodes.last
          catalog_id = last_node.css('a')[0]['href'].split('/').last.delete('^0-9').to_i
          catalog = Catalog.first(:book_id => book_id, :catalog_id=> catalog_id)
          unless catalog.nil?
            if status=='完成'
              book.close = 1
              book.save
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
              logger.error(e)
            end

          end

          if status=='完成'
            book.close = 1
            book.save
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
        logger.error(e)
      end

    end
    logger.info('Close Update.')

  end

end
# scheduler.join
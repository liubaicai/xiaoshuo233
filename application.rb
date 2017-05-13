#encoding: UTF-8

require "rubygems"

require File.join(File.dirname(__FILE__), "environment")

configure do
  set :views, "#{File.dirname(__FILE__)}/views"
  set :show_exceptions, :after_handler
end

configure :production, :development do
  enable :logging
end

helpers do
  # add your helpers here
  def pinyin chstr
    Pinyin.t(chstr, splitter: '')
  end
end

# root page
get '/' do

  cache_file = "#{File.dirname(__FILE__)}/tmp/cache_html/index.html"
  cache_dir = "#{File.dirname(__FILE__)}/tmp/cache_html"

  if File.exist?(cache_file) && (File.mtime(cache_file) >= (Time.now - 3600)) && false
    IO.read(cache_file)
  else

    @books_recommend = Book.all(:category.not => nil,:order => [ :views.desc ],:limit => 6)
    @books_hot = Book.all(:category.not => nil,:order => [ :views.desc ],:limit => 10)
    @catalog_update = Catalog.all(:fields => [:book_id], :unique => true, :order => [:book_id.desc], :limit => 10)
    @categories = Category.all

    html = erb :index

    if !Dir.exist?(cache_dir)
      Dir.mkdir(cache_dir)
    end
    if !File.exist?(cache_file) #|| (File.mtime(cache_file) < (Time.now - 3600))
      File.open(cache_file,'w'){ |f| f << html.encode('UTF-8') }
    end

    html

  end
end

get '/search.html' do
  key = params['key']
  if key==''
    @page_title = '完本小说'
    @books = Book.all(:close => 1)
  else
    @page_title = "search: `#{key}`"
    @books = Book.all(:title.like => "%#{key}%")
  end
  erb :books
end

get '/books.html' do
  @books = Book.all.paginate(:page => params[:page], :per_page => 100)
  erb :books
end

get '/books/all.html' do
  @books = Book.paginate(:page => params[:page], :per_page => 100)
  erb :books_all
end
get '/books/all.json' do
  books = Book.paginate(:page => params[:page], :per_page => 100)
  books.to_json
end

get '/:book_id.html' do
  @book = Book.get(params['book_id'].to_i)
  @title = "#{@book.title}_#{@book.title}最新章节_#{@book.author.trim}_#{SiteConfig.site_name}"
  @keywords = "#{@book.title},#{@book.title}最新章节,#{@book.author.trim}"
  @description = "#{@book.title}最新章节由网友提供，《#{@book.title}》情节跌宕起伏、扣人心弦，是一本情节与文笔俱佳的网络小说，#{SiteConfig.site_name}免费提供#{@book.title}最新清爽干净的文字章节在线阅读。"
  @book.views = @book.views+1
  @book.save
  erb :catalogs
end

get '/:book_id/:catalog_id.html' do

  cache_file = "#{File.dirname(__FILE__)}/tmp/cache_html/#{params['book_id']}/#{params['catalog_id']}.html"
  cache_dir = "#{File.dirname(__FILE__)}/tmp/cache_html/#{params['book_id']}"

  if File.exist?(cache_file) && (File.mtime(cache_file) >= (Time.now - 3600*24*7))
    IO.read(cache_file)
  else

    @catalog = Catalog.first(:book_id => params['book_id'].to_i , :catalog_id => params['catalog_id'].to_i)

    doc = Nokogiri::HTML(open(@catalog.src), nil, 'UTF-8')
    n = doc.css('div#content')[0]
    n.search('script').remove
    @content = n.inner_html.gsub!('<br>　　<br>', '<br>')

    @next_catalog = Catalog.first(:book_id => params['book_id'].to_i , :catalog_id.gt => params['catalog_id'].to_i)
    @prev_catalog = Catalog.last(:book_id => params['book_id'].to_i , :catalog_id.lt => params['catalog_id'].to_i)

    @title = "#{@catalog.title}_#{@catalog.book.title}_#{SiteConfig.site_name}"
    @keywords = "#{@catalog.book.title}, #{@catalog.title}"
    @description = "#{SiteConfig.site_name}提供了#{@catalog.book.author.trim}创作的小说《#{@catalog.book.title}》干净清爽无错字的文字章节： #{@catalog.title}在线阅读。"

    html = erb :detail

    if !Dir.exist?(cache_dir)
      Dir.mkdir(cache_dir)
    end
    if !File.exist?(cache_file) #|| (File.mtime(cache_file) < (Time.now - 3600*24*5))
      File.open(cache_file,'w'){ |f| f << html.encode('UTF-8') }
    end

    html

  end
end
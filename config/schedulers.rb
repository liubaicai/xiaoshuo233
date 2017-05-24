#coding: utf-8

scheduler = Rufus::Scheduler.singleton
scheduler.cron '0 55 * * * *' do

  begin

    unless File.exist?("#{File.dirname(__FILE__)}/../script/dushu233.pid")
      `ruby #{File.dirname(__FILE__)}/../script/dushu233.rb`
    end

  end

end

# nginx.conf：
#
# passenger_spawn_method direct;
# passenger_min_instances 1;
# passenger_pool_idle_time 0;
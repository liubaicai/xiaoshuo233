
module StringMod

  def trim
    return self.gsub(/\A\p{Space}*|\p{Space}*\z/, '')
  end

end

class String
  include StringMod
end